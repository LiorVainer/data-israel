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
├── page.tsx                  # Landing page → generates UUID → redirects to /chat/:id
├── chat/[id]/page.tsx        # Thread-based chat UI (useParams + DefaultChatTransport)
├── api/chat/route.ts         # Streaming API (handleChatStream → routingAgent)
└── globals.css               # Tailwind global styles

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
    ├── routing/              # Routing agent (orchestrator, 26 tools)
    ├── datagov/              # DataGov agent (15 tools, data.gov.il CKAN API)
    ├── cbs/                  # CBS agent (8 tools, Central Bureau of Statistics)
    └── visualization/        # Visualization agent (3 tools, deprecated)

lib/
├── tools/
│   ├── datagov/              # 15 data.gov.il tools (search, details, schema, etc.)
│   ├── cbs/                  # 8 CBS tools (catalog, series, prices, localities)
│   └── client/               # 3 client-side chart tools (bar, line, pie)
├── api/
│   ├── data-gov/             # CKAN API client (data.gov.il)
│   └── cbs/                  # CBS API client
└── convex/                   # Convex client utilities

convex/                       # Convex backend
├── convex.config.ts          # RAG component registration
├── schema.ts                 # Dataset/resource tables + Mastra memory tables
├── mastra/storage.ts         # Mastra storage handler
├── datasets.ts               # Dataset CRUD operations
├── resources.ts              # Resource CRUD operations
├── search.ts                 # RAG semantic search actions
└── rag.ts                    # RAG config (OpenRouter embeddings)

spec/
└── project.spec.md           # Authoritative specification

openspec/                     # OpenSpec workflow
├── AGENTS.md                 # Proposal-driven development instructions
├── project.md                # Project conventions
├── specs/                    # Current capability specs
└── changes/                  # Active change proposals
```

### Agent Network Flow

```
User (/) → submit message → crypto.randomUUID() → /chat/:id?q=message
                                                        ↓
                                              useChat + DefaultChatTransport
                                              body: { messages, memory: { thread: id, resource }, model }
                                                        ↓
                                              POST /api/chat
                                              handleChatStream(mastra, 'routingAgent', params)
                                                        ↓
                                              ┌─── Routing Agent (סוכן ניתוב) ───┐
                                              │  26 tools (all combined)          │
                                              │  Memory: Convex Vector + Storage  │
                                              │  Decides intent → calls tools     │
                                              └───────────────────────────────────┘
                                                        ↓
                                  ┌─────────────────────┼─────────────────────┐
                                  ↓                     ↓                     ↓
                          DataGov Tools (15)      CBS Tools (8)       Client Tools (3)
                          data.gov.il CKAN        CBS Statistics      Charts (bar/line/pie)
                          ↓                       ↓
                          ToolResultSummarizer     ToolResultSummarizer
                          (Hebrew summary)         (Hebrew summary)
                                  ↓                     ↓
                                  └──────── Final Hebrew response ────────→ Stream to UI
```

### Agents

| Agent | Hebrew Name | Tools | Role |
|-------|-------------|-------|------|
| `routingAgent` | סוכן ניתוב | 26 (all) | Orchestrator — routes queries, manages memory |
| `datagovAgent` | סוכן data.gov.il | 15 | Israeli open data search (CKAN API) |
| `cbsAgent` | סוכן הלמ"ס | 8 | Central Bureau of Statistics (series, prices, localities) |
| `visualizationAgent` | סוכן תרשימים | 3 | Chart creation (deprecated) |

### Memory & Storage

- **Instance-level storage**: `ConvexStore` on the Mastra instance (all agents inherit)
- **Vector search**: `ConvexVector` on routing agent for semantic recall (topK: 3)
- **Thread management**: UUID-based, passed from frontend via `memory: { thread, resource }`
- **Convex deployment**: `decisive-alpaca-889.convex.cloud`
- **Env vars**: `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_ADMIN_KEY`
- **Graceful fallback**: If Convex env vars are missing, storage/vector are disabled (in-memory only)

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
- **Tools**: 26 Zod-validated tools across 3 categories (DataGov, CBS, Client)
- **Processors**: `ToolResultSummarizerProcessor` converts raw API results to Hebrew summaries
- **Memory**: Persistent threads via `@mastra/convex` (ConvexStore + ConvexVector)
- **Chat routing**: UUID-based threads at `/chat/:id`, initial message via `?q=` param

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
