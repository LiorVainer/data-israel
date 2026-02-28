# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Always mark your tasks as done in '**/tasks.md' when you finish them.

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Overview

This is an **Israeli Open Data AI Agent** built with Next.js 16 and designed to chat with users about Israeli open data from data.gov.il and the Central Bureau of Statistics (CBS). The project uses:
- **Next.js 16.1.1** with App Router architecture
- **React 19.2.3** with Server Components
- **TypeScript 5** with strict type checking
- **Tailwind CSS 4** for styling
- **Mastra 1.1** agent framework with AI SDK v6
- **Convex** for persistent memory storage and RAG search
- **OpenRouter** as model provider (default: `google/gemini-3-flash-preview`)

The agent architecture is **tool-first**: rather than hallucinating dataset information, it queries external APIs through explicit, Zod-validated tools. All UI text is in **Hebrew (RTL)**.

## Development Commands

### use pnpm to install dependencies, already installed in the environment
### Dont Change the `ui/` and `ai-elements/` folders files unless instructed.

### Running the Application
```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build production bundle
npm start        # Start production server
```

### Code Quality & Verification
- No `any` or `as` type abuses were introduced
```bash
npm run lint       # Run ESLint
npm run vibecheck  # Run vibecheck code quality analyzer
tsc                # Type-check without emitting
```

## ⚠️ CRITICAL: Post-Tool Call Verification

**After EVERY tool call that modifies code, you MUST run the following commands in sequence:**

```bash
npm run build     # Verify the build succeeds
npm run lint      # Check for linting issues
npm run vibecheck # Run code quality checks
```

**Do not skip this step.** These commands ensure:
- ✅ The build compiles successfully
- ✅ No ESLint violations were introduced
- ✅ Code quality standards are maintained
- ✅ No TypeScript errors exist

If any command fails, fix the issues before proceeding.

## Architecture

### Project Structure
```
app/                          # Next.js App Router
├── layout.tsx                # Root layout (Hebrew RTL, Geist fonts)
├── page.tsx                  # Landing page (hero, about, sources, how-it-works, footer)
├── (main)/chat/[id]/
│   ├── page.tsx              # Client component — useParams + ChatThread (no Suspense flash)
│   └── loading.tsx           # Skeleton fallback (only for server-side navigation)
├── api/chat/route.ts         # Streaming API (handleChatStream → routingAgent)
└── globals.css               # Tailwind global styles + global scrollbar styling

agents/                       # Mastra agent network
├── mastra.ts                 # Mastra instance (ConvexStore instance-level storage)
├── agent.config.ts           # Model config, display limits
├── types.ts                  # Agent network type definitions
├── processors/               # Output processing pipeline
│   ├── tool-result-summarizer.processor.ts
│   ├── text-output.processor.ts
│   └── response-length-validator.processor.ts
└── network/
    ├── model.ts              # Model ID factory (getMastraModelId, getAiSdkModelId)
    ├── routing/              # Routing agent (orchestrator, delegates to sub-agents)
    ├── datagov/              # DataGov sub-agent (16 tools, data.gov.il CKAN API)
    └── cbs/                  # CBS sub-agent (9 tools, Central Bureau of Statistics)

constants/                    # Application constants
├── agents-display.ts         # Agent display configurations
├── chat.ts                   # Chat constants
├── datagov-urls.ts           # data.gov.il URL patterns
├── prompts.ts                # AI system prompts
├── tool-data-sources.ts      # Tool → data source mappings
└── tool-translations.tsx     # Hebrew tool name translations

context/                      # React context providers
├── ConvexClientProvider.tsx   # Convex client wrapper
├── QueryClientProvider.tsx    # TanStack Query provider
├── ThemeProvider.tsx          # Theme (dark/light) provider
└── UserContext.tsx            # User session context

hooks/                        # Custom React hooks
├── use-guest-session.ts      # Guest session management
├── use-mobile.ts             # Mobile breakpoint detection
├── use-threads-data.ts       # Thread listing/management
└── ...                       # Additional utility hooks

services/                     # Service layer
└── thread.service.ts         # Thread CRUD operations

scripts/                      # Data sync utilities
├── fetch-all-datasets.ts     # Fetch all datasets from data.gov.il
└── sync-to-convex.ts         # Sync datasets to Convex

lib/
├── tools/
│   ├── datagov/              # 16 data.gov.il tools (search, details, schema, etc.)
│   ├── cbs/                  # 9 CBS tools (catalog, series, prices, localities)
│   └── client/               # 3 client-side chart tools (bar, line, pie)
├── api/
│   ├── data-gov/             # CKAN API client (data.gov.il)
│   └── cbs/                  # CBS API client
├── redis/                    # Redis/Upstash rate limiting & caching
└── convex/                   # Convex client utilities

convex/                       # Convex backend
├── convex.config.ts          # RAG component registration
├── schema.ts                 # Dataset/resource tables + Mastra memory tables
├── mastra/storage.ts         # Mastra storage handler
├── datasets.ts               # Dataset CRUD operations
├── resources.ts              # Resource CRUD operations
├── search.ts                 # RAG semantic search actions
└── rag.ts                    # RAG config (OpenRouter embeddings)

components/
├── navigation/
│   ├── AppSidebar.tsx        # Sidebar layout wrapper (HomeLogoButton, NewThreadButton, SidebarTrigger)
│   ├── NavUser.tsx           # User profile in sidebar footer
│   └── SidebarToolbar.tsx    # "New chat" button inside sidebar
├── chat/
│   ├── ChatThread.tsx        # Main chat client component (useChat, message hydration, ?new param handling)
│   ├── EmptyConversation.tsx # Empty state with prompt cards (fixed header, scrollable suggestions)
│   ├── HeroSection.tsx       # Landing hero with CTA buttons
│   ├── MessageItem.tsx       # Message renderer (source URL dedup by URL + title)
│   └── Suggestions.tsx       # Follow-up suggestion chips (horizontal scroll mobile, vertical desktop)
├── threads/                  # Thread list and management components
├── landing/
│   ├── AboutSection.tsx      # About section
│   ├── SourcesSection.tsx    # Data sources section (replaced StatsSection)
│   ├── HowItWorksSection.tsx # How-it-works steps
│   ├── ExampleOutputsSection.tsx
│   └── Footer.tsx            # Footer with copyright
├── ai-elements/              # AI UI elements (DO NOT modify unless instructed)
└── ui/                       # shadcn/ui primitives (DO NOT modify unless instructed)

spec/
└── project.spec.md           # Authoritative specification

openspec/                     # OpenSpec workflow
├── AGENTS.md                 # Proposal-driven development instructions
├── project.md                # Project conventions
├── specs/                    # Current capability specs
└── changes/                  # Active change proposals
```

### Agent Network Flow

The routing agent **delegates** to specialized sub-agents via Mastra's agent network (`agents: { datagovAgent, cbsAgent }`). Sub-agents run as tool calls (`tool-agent-datagovAgent`, `tool-agent-cbsAgent`) with their own memory threads.

```
User (/) → submit message → crypto.randomUUID() → /chat/:id?new
                                                        ↓
                                              useChat + DefaultChatTransport
                                              body: { messages, memory: { thread: id, resource }, model }
                                                        ↓
                                              POST /api/chat
                                              handleChatStream(mastra, 'routingAgent', params)
                                                        ↓
                                              ┌─── Routing Agent (סוכן ניתוב) ───┐
                                              │  Client Tools (4) + Agent Delegation │
                                              │  Memory: Convex Vector + Storage  │
                                              │  Decides intent → delegates       │
                                              └───────────────────────────────────┘
                                                        ↓
                              ┌──────────────────────────┼──────────────────────┐
                              ↓                          ↓                      ↓
                    datagovAgent (sub-agent)     cbsAgent (sub-agent)    Client Tools (direct)
                    16 tools + own memory        9 tools + own memory    Charts + suggestFollowUps
                    data.gov.il CKAN             CBS Statistics
                    ↓                            ↓
                    Stores results in            Stores results in
                    separate Convex thread       separate Convex thread
                              ↓                          ↓
                              └──────── Final Hebrew response ────────→ Stream to UI
```

### Agents

| Agent | Hebrew Name | Tools | Role |
|-------|-------------|-------|------|
| `routingAgent` | סוכן ניתוב | 4 direct + 2 sub-agents | Orchestrator — delegates to sub-agents, manages memory, creates charts |
| `datagovAgent` | סוכן data.gov.il | 16 | Israeli open data search (CKAN API) — runs as sub-agent |
| `cbsAgent` | סוכן הלמ"ס | 9 | Central Bureau of Statistics (series, prices, localities) — runs as sub-agent |

### Streaming Architecture (handleChatStream)

When the routing agent delegates to a sub-agent, Mastra's `handleChatStream` emits two companion message parts:

1. **`tool-agent-<name>`** — Standard tool call part (input: prompt, output: `{ text, subAgentThreadId, subAgentResourceId }`)
2. **`data-tool-agent`** — Streaming-only artifact containing the sub-agent's internal `toolCalls`, `toolResults`, and `steps`

The `data-tool-agent` parts are **not stored in memory** — they are streaming artifacts only. On page reload, `enrichWithSubAgentData()` in `GET /api/chat` reconstructs them via two-pass recall:

1. Scan recalled messages for `tool-agent-*` parts with `subAgentThreadId`
2. Fetch each sub-agent's separate memory thread via `memory.recall()`
3. Extract tool invocations and reconstruct `data-tool-agent` parts

### UI Rendering Pipeline (MessageItem)

`MessageItem` orchestrates all message rendering via `segmentMessageParts()`, which groups consecutive server-side tool parts into `tool-group` segments (absorbing step-boundary parts like reasoning and empty text between tools). Client tools (charts, source URLs) are excluded from tool groups and rendered separately.

**Render branches by segment type:**
- **tool-group** → `ToolCallParts` → `ChainOfThought` timeline with grouped steps and progress stats
- **text** → `TextMessagePart` (markdown with regenerate action on last message)
- **reasoning** → `ReasoningPart` (thinking indicator)
- **chart tools** (displayBarChart/Line/Pie) → `ChartRenderer` / `ChartLoadingState` / `ChartError`

**Sub-agent tool calls** (`ToolCallParts`): `buildAgentInternalCallsMap()` scans `data-tool-agent` parts to extract internal tool calls, then `groupToolCalls()` merges them with agent-level parts for the timeline UI.

**Source URL collection** (3 sources, deduplicated by URL + title):
1. Native `source-url` parts from AI SDK stream
2. Dedicated source URL tools (`generateDataGovSourceUrl`, `generateCbsSourceUrl`)
3. Auto-resolved from data tool outputs via `resolveToolSourceUrl()` (scans both direct tools and sub-agent results inside `data-tool-agent` parts)

Key types in `components/chat/types.ts`:
- `AgentDataPart` / `isAgentDataPart()` — typed shape and guard for `data-tool-agent` parts
- `ToolCallPart` / `getToolStatus()` — tool state handling (active/complete)
- `SourceUrlUIPart` — unified source URL shape

### Navigation & Chat Loading

- **Branding**: Site is named "סוכני המידע הציבורי" (used in layout metadata, sidebar, hero)
- **New conversations**: Created via `crypto.randomUUID()` + `router.push(/chat/${id}?new)`. The `?new` query param tells ChatThread to skip message fetching (no loading skeleton flash). On first message send, `?new` is removed from URL via `replaceState`.
- **Existing conversations**: ChatThread fetches saved messages via `useQuery` → shows `MessageListSkeleton` while loading → then renders messages. `EmptyConversation` only shows when query is not fetching and messages are empty.
- **Chat page**: Client component (`'use client'`) using `useParams()` to avoid Suspense boundary flash from async server components.
- **Sidebar inset buttons**: `HomeLogoButton` (logo → landing page) and `NewThreadButton` (new chat) sit next to `SidebarTrigger`. All hidden when sidebar is open; `HomeLogoButton` also hidden on landing page. Buttons have shadow on mobile for visibility.
- **Source URL deduplication**: `MessageItem` deduplicates sources by both URL and title to prevent duplicate chips.

### Memory & Storage

- **Instance-level storage**: `ConvexStore` on the Mastra instance (all agents inherit)
- **Vector search**: `ConvexVector` on routing agent for semantic recall (topK: 3)
- **Thread management**: UUID-based, passed from frontend via `memory: { thread, resource }`
- **Convex deployment**: `decisive-alpaca-889.convex.cloud`
- **Graceful fallback**: If Convex env vars are missing, storage/vector are disabled (in-memory only)

### Integrations

- **Authentication**: Clerk (sign-in/sign-up flows, user context via `UserContext.tsx`)
- **Error tracking**: Sentry (client/server/edge configs in root, `instrumentation.ts` for Next.js)
- **Rate limiting/caching**: Redis via Upstash (`lib/redis/`)
- **Code formatting**: Prettier (`.prettierrc`), shadcn config (`components.json`)

### Environment Variables

Key env vars (see `.env.example` for base set):

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API access |
| `AI_DEFAULT_MODEL_ID` | Default model (e.g., `google/gemini-3-flash-preview`) |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `CONVEX_ADMIN_KEY` | Convex admin access |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth (public) |
| `CLERK_SECRET_KEY` | Clerk auth (server) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking |
| `SENTRY_AUTH_TOKEN` | Sentry source maps upload |

### Path Aliases
The project uses `@/*` to reference files from the root:
```typescript
import { Component } from "@/app/component"
```

### Font System
The project uses Geist font family (Geist Sans + Geist Mono) loaded via `next/font/google` with CSS variables:
- `--font-geist-sans`
- `--font-geist-mono`

## TypeScript Guidelines

### Type Safety Rules
1. **Minimize `as` type assertions** - Use proper type guards and inference instead
2. **Avoid `any` type** - Use `unknown` or proper types
3. **Always run `tsc` after changes** - Verify no new errors were introduced
4. **Strict mode enabled** - All strict TypeScript checks are active

### Common Patterns
- Use type inference where possible
- Prefer interfaces for object shapes
- Use `Readonly<>` for immutable props
- Leverage TypeScript's utility types (e.g., `Pick`, `Omit`, `Partial`)

## AI Agent Implementation

The agent uses **Mastra 1.1** with AI SDK v6 tools. Key implementation details:

- **Framework**: Mastra agent network with `handleChatStream` for streaming
- **Model**: OpenRouter provider, default `google/gemini-3-flash-preview`
- **Architecture**: Routing agent delegates to sub-agents (`datagovAgent`, `cbsAgent`) via `agents: {}` — not direct tool registration
- **Routing agent tools**: 4 direct (displayBarChart, displayLineChart, displayPieChart, suggestFollowUps) + 2 sub-agents
- **Sub-agent tools**: DataGov (16 tools), CBS (9 tools) — each with own memory thread
- **Processors**: `ToolResultSummarizerProcessor` converts raw API results to Hebrew summaries
- **Memory**: Persistent threads via `@mastra/convex` (ConvexStore + ConvexVector). Sub-agents store results in separate threads linked via `subAgentThreadId`
- **Two-pass recall**: `GET /api/chat` fetches routing agent thread, then sub-agent threads to reconstruct internal tool call data for UI
- **Chat routing**: UUID-based threads at `/chat/:id`, new conversations use `?new` query param to skip message loading

### Data Sources
- **data.gov.il**: CKAN API at `https://data.gov.il/api/3` (datasets, organizations, groups, tags, resources, DataStore)
- **CBS (הלמ"ס)**: Statistical series, price indices, CPI calculations, locality dictionary
- **Convex RAG**: Semantic search over synced datasets (OpenRouter embeddings)

## Code Review Checklist

Before committing changes:
- [ ] Run `npm run build` to verify build succeeds
- [ ] Run `npm run lint` to check for linting issues
- [ ] Run `npm run vibecheck` for code quality validation
- [ ] Test in browser at `localhost:3000`
- [ ] Verify type assertions (`as`) are necessary
- [ ] Ensure no `any` types were added
- [ ] Check that Server Components don't use client-only hooks

## OpenSpec Workflow

This project uses OpenSpec for specification-driven development. When working on new features or architectural changes:

1. **Check for existing specs**: Read `openspec/AGENTS.md` first
2. **Create proposals**: Use OpenSpec workflow for new capabilities
3. **Reference the spec**: `spec/project.spec.md` is the authoritative source for agent design
4. **Validate changes**: Run `openspec validate --strict` before implementation
5. When Implementing, always give each major task (e.g 1.0 - 2.0) to a separate subagent.
6. When implementing, always follow the tasks in the relevant `tasks.md` file.
7. When implementing, always mark tasks as done in the relevant `tasks.md` file.
8. When implementing, always use the advanced typescript-pro subagent.

See `openspec/AGENTS.md` for detailed instructions on creating proposals and managing specifications.
