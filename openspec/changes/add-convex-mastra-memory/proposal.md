# Change: Replace LibSQL In-Memory Storage with Convex for Mastra Agent Memory + Thread-Based Chat Routing

## Why

The Mastra agents currently use `@mastra/libsql` with `url: ':memory:'`, meaning all conversation history and threads are lost on every server restart. The chat also runs on a single page with no URL-based thread identity — users can't bookmark or return to conversations.

The project already has a Convex deployment (`decisive-alpaca-889.convex.cloud`) with RAG configured. The `@convex-dev/mastra` package provides `ConvexStorage` and `ConvexVector` as drop-in replacements for LibSQL, enabling persistent agent memory backed by the existing Convex instance.

Benefits:
- **Persistent memory**: Conversation threads survive server restarts
- **Semantic recall**: `ConvexVector` enables RAG on message history (find relevant past messages)
- **Unified backend**: Single Convex deployment for both dataset search and agent memory
- **Thread-based routing**: Each conversation gets a unique URL (`/chat/:id`)
- **Reactive queries**: Convex's reactivity enables real-time thread status queries

## What Changes

### Backend (Convex + Mastra)
1. **Install `@convex-dev/mastra`** and register the Mastra component in `convex/convex.config.ts`
2. **Update Mastra instance** (`agents/mastra.ts`) to pass `ConvexStorage` as instance-level storage — all agents inherit it automatically
3. **Simplify routing agent** (`agents/network/routing/routing.agent.ts`) to use `new Memory()` with only options (no storage arg)
4. **Update API route** (`app/api/chat/route.ts`) to accept `memory: { thread, resource }` from the request body via `handleChatStream` params
5. **Remove `@mastra/libsql`** dependency if no longer needed

### Frontend (Thread-Based Chat Routing)
6. **Create `app/chat/[id]/page.tsx`** — dynamic route that renders the chat UI for a specific thread
7. **Create a chat context/provider** that generates a UUID for new chats and navigates to `/chat/:id`
8. **Update home page** (`app/page.tsx`) — on first message submit, generate UUID, navigate to `/chat/:id`, then send the message
9. **Update `useChat`** to use `DefaultChatTransport` with `prepareSendMessagesRequest` that passes `memory: { thread: chatId, resource: 'default-user' }` in the body
10. **Use `useParams`** in `app/chat/[id]/page.tsx` to extract the chat ID and pass it to `useChat`

## Impact

- **Affected specs**: `agent-orchestration` (MODIFIED: memory config)
- **New specs**: `agent-memory` (ADDED: Convex-backed persistent memory + thread routing)
- **Affected code**:
  - `convex/convex.config.ts` - Add mastra component alongside rag
  - `agents/mastra.ts` - Add ConvexStorage as instance-level storage
  - `agents/network/routing/routing.agent.ts` - Simplify to `new Memory()` (inherits storage)
  - `app/api/chat/route.ts` - Accept memory params from body
  - `app/chat/[id]/page.tsx` - New dynamic chat route
  - `app/page.tsx` - Redirect to `/chat/:id` on first message
- **Dependencies**: Add `@convex-dev/mastra`, `uuid`; potentially remove `@mastra/libsql`
- **Environment**: Add `NEXT_PUBLIC_CONVEX_URL` (or reuse existing Convex env var)

## **BREAKING** Changes

- Agent memory is no longer ephemeral; threads accumulate in Convex
- Chat UI moves from `/` to `/chat/:id` for active conversations
- Requires Convex dev server running (`npx convex dev`) for memory to work
- `useChat` now uses `DefaultChatTransport` instead of default fetch transport
