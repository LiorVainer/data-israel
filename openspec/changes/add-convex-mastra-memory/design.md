# Design: Convex Memory for Mastra Agents

## Context

The project runs Mastra agents with `@mastra/memory` using `LibSQLStore` at `:memory:`. This is volatile - all conversation history is lost on restart. The project already has a Convex deployment at `decisive-alpaca-889.convex.cloud` with the RAG component for dataset search. The `@convex-dev/mastra` package provides `ConvexStorage` and `ConvexVector` that implement Mastra's storage/vector interfaces, backed by Convex tables.

### Stakeholders
- End users: Benefit from persistent conversation history and semantic recall
- Developers: Must run Convex dev server alongside Next.js dev server

## Goals / Non-Goals

### Goals
- Persistent agent memory across server restarts
- Semantic recall on message history via ConvexVector
- Reuse existing Convex deployment (no new infrastructure)
- Drop-in replacement with minimal agent code changes
- Thread-based chat routing: each conversation gets a unique URL (`/chat/:id`)
- New chat flow: home page → generate UUID → redirect to `/chat/:id`

### Non-Goals
- Multi-user thread isolation (single-user for now)
- Thread management UI (list/delete threads)
- Custom memory eviction policies
- Working memory (can be added later)
- Chat history sidebar (can be added later using Convex thread queries)

## Decisions

### Decision 1: Use `@convex-dev/mastra` Component
**What**: Use the official Convex-Mastra integration package
**Why**:
- Implements Mastra's `MastraStorage` and `MastraVector` interfaces
- Handles thread/message serialization to Convex tables
- Maintained by Convex team
- Single `app.use(mastra)` in convex.config.ts

**Alternatives considered**:
- LibSQL with file URL (`file:./memory.db`): Simpler but no vector search, no reactive queries
- Turso (hosted LibSQL): Another service to manage, no vector built-in
- PostgreSQL + pgvector: Heavy, separate infrastructure

### Decision 2: Instance-Level Storage (Not Per-Agent)
**What**: Configure `ConvexStorage` on the `Mastra` instance, not on individual agents
**Why**:
- Mastra supports instance-level storage: all agents, workflows, and traces share the same backend
- Agents only need `memory: new Memory()` with no storage arg — they inherit from the Mastra instance
- Simpler configuration, single source of truth
- Matches Mastra docs: "add storage to your Mastra instance so all agents share the same memory provider"

**Implementation approach**:
```typescript
// agents/mastra.ts
import { Mastra } from '@mastra/core';
import { ConvexStorage, ConvexVector } from '@convex-dev/mastra';
import { components } from '@/convex/_generated/api';

const storage = new ConvexStorage(components.mastra);
const vector = new ConvexVector(components.mastra);

export const mastra = new Mastra({
  agents,
  storage,
});
```

```typescript
// agents/network/routing/routing.agent.ts
// Agent just uses Memory() with no storage — inherits from Mastra instance
memory: new Memory({
  options: {
    lastMessages: 20,
    semanticRecall: { topK: 3, messageRange: 2 },
    generateTitle: true,
  },
})
```

### Decision 3: Memory Configuration Options (Per-Agent)
**What**: Each agent configures `Memory` options (lastMessages, semanticRecall) but NOT storage
**Why**:
- Storage is shared at instance level (Decision 2)
- Memory options like `lastMessages` and `semanticRecall` can vary per agent if needed
- `generateTitle: true` auto-names threads for potential future UI

```typescript
memory: new Memory({
  options: {
    lastMessages: 20,
    semanticRecall: { topK: 3, messageRange: 2 },
    generateTitle: true,
  },
})
```

### Decision 4: Keep Both RAG and Mastra Components
**What**: Register both `rag` and `mastra` in convex.config.ts
**Why**:
- RAG is used for dataset/resource semantic search (existing functionality)
- Mastra is used for agent memory (new functionality)
- Both are independent Convex components with separate tables

```typescript
import rag from '@convex-dev/rag/convex.config.js';
import mastra from '@convex-dev/mastra/convex.config';

const app = defineApp();
app.use(rag);
app.use(mastra);
```

### Decision 5: Thread-Based Chat Routing with UUID
**What**: Each conversation lives at `/chat/:id` where `:id` is a UUID generated on the client
**Why**:
- Enables bookmarkable/shareable conversation URLs
- Thread ID doubles as Mastra memory thread ID (passed via `memory: { thread: id }`)
- Clean separation: home page (`/`) is landing/new-chat, `/chat/:id` is active conversation

**Flow**:
1. User lands on `/` (landing page with suggestions)
2. User submits first message
3. Client generates UUID via `crypto.randomUUID()`
4. Client navigates to `/chat/${uuid}` via `router.push()`
5. Initial message passed via URL search param (`?q=...`) or sessionStorage
6. `/chat/:id` page mounts, reads `useParams().id`, configures `useChat` with thread ID
7. On mount, auto-sends the initial message

### Decision 6: DefaultChatTransport for Thread Memory
**What**: Use Mastra's `DefaultChatTransport` with `prepareSendMessagesRequest` to pass `memory` config
**Why**:
- Official Mastra pattern for passing `threadId` and `resourceId` to the backend
- `handleChatStream` on the server receives these params and passes them to the agent
- No custom API route logic needed — Mastra handles thread/message persistence

**Implementation**:
```typescript
// app/chat/[id]/page.tsx
import { DefaultChatTransport } from '@mastra/ai-sdk';

const chatId = useParams().id as string;

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    prepareSendMessagesRequest({ messages }) {
      return {
        body: {
          messages,
          memory: {
            thread: chatId,
            resource: 'default-user',
          },
        },
      };
    },
  }),
});
```

### Decision 7: Initial Message Passing via Search Params
**What**: Pass the first message from home page to `/chat/:id` via URL search parameter `?q=`
**Why**:
- Stateless — no context provider or sessionStorage needed
- Works with page refreshes and direct navigation
- Clean URL: `/chat/abc-123?q=מה%20הנתונים%20הפתוחים`
- The `q` param is consumed on mount and cleared from URL

**Alternatives considered**:
- React Context: Requires provider wrapping, lost on refresh
- sessionStorage: Works but adds side-effect complexity
- Route state (Next.js): Not supported in App Router `router.push()`

## Risks / Trade-offs

### Risk: setCtx Requirement in Non-Convex Context
- **Problem**: The API route runs in Next.js, not inside a Convex action. `setCtx(ctx)` expects a Convex `ActionCtx`.
- **Mitigation**: Use the Convex HTTP client or `ConvexHttpClient` to provide context. Alternatively, wrap agent calls in Convex actions. Need to verify compatibility with `handleChatStream` from `@mastra/ai-sdk`.
- **Investigation needed**: Confirm whether `ConvexStorage`/`ConvexVector` can work outside Convex actions via HTTP client, or if agent execution must move into a Convex action.

### Risk: Dual Dev Server Requirement
- **Problem**: Developers must run both `npx convex dev` and `npm run dev`
- **Mitigation**: Add concurrent script in package.json: `"dev:all": "concurrently \"npx convex dev\" \"next dev\""`

### Risk: Storage Growth
- **Problem**: Messages accumulate indefinitely in Convex
- **Mitigation**: Acceptable for MVP. Add cleanup/archival later if needed.

### Trade-off: Complexity vs. Persistence
- **Trade-off**: Adding Convex memory increases setup complexity
- **Chosen approach**: Persistence is worth the complexity for a production agent
- **Rationale**: In-memory storage is only acceptable for prototyping

## Migration Plan

### Phase 1: Install & Configure
1. Install `@convex-dev/mastra`
2. Register component in `convex/convex.config.ts`
3. Run `npx convex dev` to deploy new tables
4. Verify Convex dashboard shows mastra tables

### Phase 2: Backend Integration
1. Update `agents/mastra.ts` to pass ConvexStorage as instance-level storage
2. Update routing agent to use `new Memory()` (no storage arg, inherits from instance)
3. Update API route with setCtx pattern (or move to Convex action)
4. Test thread creation and message persistence

### Phase 3: Frontend Chat Routing
1. Create `app/chat/[id]/page.tsx` with `useParams` + `useChat` + `DefaultChatTransport`
2. Update `app/page.tsx` to generate UUID and redirect on first message
3. Implement initial message passing via `?q=` search param
4. Test full flow: home → submit → redirect → chat streams

### Phase 4: Verify & Clean Up
1. Verify messages persist across server restarts
2. Test semantic recall on message history
3. Test direct navigation to `/chat/:id` loads thread history
4. Remove `@mastra/libsql` if unused
5. Update dev scripts

### Rollback
- Revert to LibSQLStore by restoring original agent config
- Convex mastra tables can remain (no data loss)

## Open Questions

1. **setCtx in Next.js**: Can `ConvexStorage.setCtx()` work with a `ConvexHttpClient` outside Convex actions, or must agent execution move into a Convex action?
2. **Streaming compatibility**: Does `handleChatStream` from `@mastra/ai-sdk` work when the agent runs inside a Convex action?
3. **Thread history loading**: When navigating to `/chat/:id` for an existing thread, does `useChat` automatically load previous messages from Mastra memory, or do we need to pre-fetch and pass `initialMessages`?
4. **Hebrew in search params**: Verify `?q=` works correctly with Hebrew UTF-8 encoding in Next.js App Router
