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

This is an **Israeli Open Data AI Agent** built with Next.js 16 and designed to chat with users about Israeli open data from 8 government and public sources (data.gov.il, CBS, BudgetKey, Nadlan, Israel Drugs, IL Health, Grocery Prices, and Knesset). The project uses:
- **Next.js 16.1.1** with App Router architecture
- **React 19.2.3** with Server Components
- **TypeScript 5** with strict type checking
- **Tailwind CSS 4** for styling
- **Mastra 1.1** agent framework with AI SDK v6
- **Convex** for persistent memory storage and RAG search
- **OpenRouter** as model provider (default: `google/gemini-3-flash-preview`)

The agent architecture is **tool-first**: rather than hallucinating dataset information, it queries external APIs through explicit, Zod-validated tools. All UI text is in **Hebrew (RTL)**.

## Development Commands

### Running the Application
```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build production bundle
npm start        # Start production server
```

### Convex Backend
```bash
npx convex dev   # Start Convex dev server + regenerate `convex/_generated/api`
```
> See `.claude/rules/convex-codegen.md` — loads automatically when editing anything under `convex/` or `src/**/*.ts{,x}`.

### Code Quality & Verification
```bash
npm run lint       # Run ESLint
npm run vibecheck  # Run vibecheck code quality analyzer
npm run fallow     # Fallow codebase intelligence (dead code + duplication + complexity)
tsc                # Type-check without emitting
```
> See `.claude/rules/typescript-strict.md` for strict-mode and `any`/`as` rules — loads automatically when editing TypeScript files.

`.fallowrc.json` excludes vendored UI (`src/components/ai-elements/**`, `src/components/ui/**`), generated Convex code, `public/**`, and test fixtures. The `code-quality` capability spec at `openspec/specs/code-quality/spec.md` (or active proposal `openspec/changes/add-fallow-codebase-cleanup/`) defines the gate, ignore-pattern policy, and post-feature check sequence.

## Post-Change Verification

Hooks auto-run ESLint --fix per edit and a quality gate (tsc + vibecheck + tests) on Stop. For major changes, also run: `npm run build`

### Post-Feature Quality Checks

After completing any feature or bug fix, run this sequence and resolve any reported issues before declaring the work done:

1. `npx eslint --fix .` — fix lint issues
2. `tsc --noEmit` — type check passes
3. `npm run fallow` — Fallow reports no new dead code, duplicate exports, or complexity hotspots
4. Triage anything Fallow flags (delete, dedupe, suppress with `// fallow-ignore-next-line <rule>`, or open a follow-up task)
5. Report task complete

## Architecture

### Project Structure
```
src/                              # Application source code
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Hebrew RTL, Geist fonts)
│   ├── page.tsx                  # Landing page (hero, about, sources, how-it-works, footer)
│   ├── (main)/chat/[id]/
│   │   ├── page.tsx              # Client component — useParams + ChatThread (no Suspense flash)
│   │   └── loading.tsx           # Skeleton fallback (only for server-side navigation)
│   ├── api/chat/route.ts         # Streaming API (handleChatStream → routingAgent)
│   └── globals.css               # Tailwind global styles + global scrollbar styling
│
├── agents/                       # Mastra agent network
│   ├── mastra.ts                 # Mastra instance (ConvexStore instance-level storage)
│   ├── agent.config.ts           # Model config, display limits
│   ├── types.ts                  # Agent network type definitions
│   ├── processors/               # Output processing pipeline
│   │   ├── tool-result-summarizer.processor.ts
│   │   ├── text-output.processor.ts
│   │   └── response-length-validator.processor.ts
│   └── network/
│       ├── model.ts              # Model ID factory (getMastraModelId, getAiSdkModelId)
│       └── routing/              # Routing agent (orchestrator, delegates to sub-agents)
│
├── data-sources/                 # Self-contained data source modules
│   ├── types/                    # Shared types (DataSourceDefinition, ToolTranslation, etc.)
│   ├── registry.ts               # Client-safe aggregation (tools, translations, resolvers)
│   ├── registry.server.ts        # Server-only agent references (@mastra/core/agent)
│   ├── cbs/                      # CBS (9 tools, Central Bureau of Statistics)
│   ├── datagov/                  # DataGov (16 tools, data.gov.il CKAN API)
│   ├── budget/                   # BudgetKey (3 MCP tools, state budget 1997-2025)
│   ├── govmap/                   # GovMap (11 tools, nadlan real estate + layers-catalog)
│   ├── drugs/                    # Drugs (8 tools, pharmaceutical database)
│   ├── health/                   # Health (5 tools, MOH dashboards)
│   └── grocery/                  # Grocery (5 tools, supermarket prices)
│
├── constants/                    # Application constants
│   ├── agents-display.ts         # Agent display configurations
│   ├── chat.ts                   # Chat constants
│   ├── datagov-urls.ts           # data.gov.il URL patterns
│   ├── prompts.ts                # AI system prompts
│   ├── tool-data-sources.ts      # Tool → data source mappings
│   └── tool-translations.tsx     # Hebrew tool name translations
│
├── context/                      # React context providers
│   ├── ConvexClientProvider.tsx   # Convex client wrapper
│   ├── QueryClientProvider.tsx    # TanStack Query provider
│   ├── ThemeProvider.tsx          # Theme (dark/light) provider
│   └── UserContext.tsx            # User session context
│
├── hooks/                        # Custom React hooks
│   ├── use-guest-session.ts      # Guest session management
│   ├── use-mobile.ts             # Mobile breakpoint detection
│   ├── use-threads-data.ts       # Thread listing/management
│   └── ...                       # Additional utility hooks
│
├── services/                     # Service layer
│   └── thread.service.ts         # Thread CRUD operations
│
├── scripts/                      # Data sync utilities
│   ├── fetch-all-datasets.ts     # Fetch all datasets from data.gov.il
│   └── sync-to-convex.ts         # Sync datasets to Convex
│
├── lib/
│   ├── tools/
│   │   └── client/               # 4 client-side tools (bar, line, pie charts + suggestions)
│   ├── redis/                    # Redis/Upstash rate limiting & caching
│   └── convex/                   # Convex client utilities
│
├── components/
│   ├── navigation/
│   │   ├── AppSidebar.tsx        # Sidebar layout wrapper (HomeLogoButton, NewThreadButton, SidebarTrigger)
│   │   ├── NavUser.tsx           # User profile in sidebar footer
│   │   └── SidebarToolbar.tsx    # "New chat" button inside sidebar
│   ├── chat/
│   │   ├── ChatThread.tsx        # Main chat client component (useChat, message hydration, ?new param handling)
│   │   ├── EmptyConversation.tsx # Empty state with prompt cards (fixed header, scrollable suggestions)
│   │   ├── HeroSection.tsx       # Landing hero with CTA buttons
│   │   ├── MessageItem.tsx       # Message renderer (source URL dedup by URL + title)
│   │   └── Suggestions.tsx       # Follow-up suggestion chips (horizontal scroll mobile, vertical desktop)
│   ├── threads/                  # Thread list and management components
│   ├── landing/
│   │   ├── AboutSection.tsx      # About section
│   │   ├── SourcesSection.tsx    # Data sources section (replaced StatsSection)
│   │   ├── HowItWorksSection.tsx # How-it-works steps
│   │   ├── ExampleOutputsSection.tsx
│   │   └── Footer.tsx            # Footer with copyright
│   ├── ai-elements/              # AI UI elements (DO NOT modify unless instructed)
│   └── ui/                       # shadcn/ui primitives (DO NOT modify unless instructed)
│
├── instrumentation.ts            # Next.js instrumentation (Sentry)
└── proxy.ts                      # Proxy configuration

convex/                           # Convex backend (root level)
├── convex.config.ts              # RAG component registration
├── schema.ts                     # Dataset/resource tables + Mastra memory tables
├── mastra/storage.ts             # Mastra storage handler
├── datasets.ts                   # Dataset CRUD operations
├── resources.ts                  # Resource CRUD operations
├── search.ts                     # RAG semantic search actions
└── rag.ts                        # RAG config (OpenRouter embeddings)

openspec/                         # OpenSpec workflow (root level)
├── AGENTS.md                     # Proposal-driven development instructions
├── project.md                    # Project conventions
├── specs/                        # Current capability specs
└── changes/                      # Active change proposals
```

### Agent Network & Streaming

The routing agent **delegates** to 7 specialized sub-agents via Mastra's agent network. Each sub-agent runs as a tool call (`tool-agent-<agentId>`) with its own Convex memory thread, linked back via `subAgentThreadId`. On page reload, `enrichWithSubAgentData()` in `GET /api/chat` uses two-pass recall to reconstruct sub-agent tool-call artifacts for the UI.

> See `.claude/rules/agent-network.md` for the full architecture (agent table, streaming protocol, `handleChatStream`, memory model, processors) — loads automatically when editing files under `src/agents/**`, `src/app/api/chat/**`, or `src/constants/prompts.ts`.

### Chat UI Rendering & Navigation

Chat pages live at `/chat/:id` with UUID-based threads. New conversations use a `?new` query param to skip message fetching (avoids a loading skeleton flash). Message rendering goes through `MessageItem` → `segmentMessageParts()` → `ToolCallParts` / `TextMessagePart` / `ChartRenderer`. Source URLs come from three sources and are deduplicated by URL + title.

**Branding**: Site is named "סוכני המידע הציבורי" (used in layout metadata, sidebar, hero).

> See `.claude/rules/chat-rendering.md` for the full pipeline (segmentation, tool-group grouping, `buildAgentInternalCallsMap`, source URL collection, `?new` param, sidebar button visibility, key types) — loads automatically when editing files under `src/components/chat/**` or `src/app/(main)/chat/**`.

### Integrations

- **Authentication**: Clerk (sign-in/sign-up flows, user context via `src/context/UserContext.tsx`)
- **Error tracking**: Sentry (client/server/edge configs in root, `src/instrumentation.ts` for Next.js)
- **Rate limiting/caching**: Redis via Upstash (`src/lib/redis/`)
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
The project uses `@/*` to reference files from the `src/` directory:
```typescript
import { Component } from "@/app/component"  // resolves to src/app/component
import { api } from "@/convex/_generated/api"  // resolves to convex/_generated/api (root)
```
**Exception:** `@/convex/*` maps to `./convex/*` (root level) since Convex stays at root.

### Font System
The project uses Geist font family (Geist Sans + Geist Mono) loaded via `next/font/google` with CSS variables:
- `--font-geist-sans`
- `--font-geist-mono`

## Data Sources
- **data.gov.il**: CKAN API at `https://data.gov.il/api/3` (datasets, organizations, groups, tags, resources, DataStore)
- **CBS (הלמ"ס)**: Statistical series, price indices, CPI calculations, locality dictionary
- **BudgetKey**: MCP endpoint at `https://next.obudget.org/mcp` (state budget, contracts, tenders, entities, revenues)
- **GovMap**: REST API at `https://www.govmap.gov.il/api/` (real estate transactions, price trends, valuations, nearby public services, land parcels, tourism/recreation, area demographics — multi-layer geospatial via layers-catalog)
- **Israel Drugs**: REST API at `https://israeldrugs.health.gov.il/GovServiceList/IDRServer` (drug registry, generics, health basket)
- **IL Health**: REST API at `https://datadashboard.health.gov.il/api` (public health dashboards, HMO data, service quality)
- **Grocery Prices**: XML feeds from supermarket chains (Shufersal, Rami Levy, Yochananof, Victory, Osher Ad, Tiv Taam)
- **Knesset** *(planned)*: OData at `http://knesset.gov.il/Odata/ParliamentInfo.svc` (bills, committees, members)
- **Convex RAG**: Semantic search over synced datasets (OpenRouter embeddings)

## OpenSpec Workflow

This project uses OpenSpec for specification-driven development. See `openspec/AGENTS.md` for detailed instructions on creating proposals and managing specifications.

> See `.claude/rules/openspec-workflow.md` for implementation rules (subagent-per-task, task marking, Notion sync details) — loads automatically when editing `openspec/changes/**/{tasks,proposal,design}.md` or `openspec/specs/**`.
