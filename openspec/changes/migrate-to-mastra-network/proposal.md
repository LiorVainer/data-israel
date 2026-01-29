# Change: Migrate from AI SDK ToolLoopAgent to Mastra Agent Network

## Why

The current single `ToolLoopAgent` bundles 24 tools from three distinct domains (data.gov.il, CBS statistics, visualization) into one agent. This limits routing accuracy — the LLM must reason about all tools simultaneously, increasing latency and error rates for domain-specific queries. A multi-agent network allows each sub-agent to carry domain-specific instructions and a focused toolset, improving response quality and enabling independent evolution of each domain.

## What Changes

- **Replace `ToolLoopAgent`** with Mastra Agent Network consisting of:
  - 1 **Routing Agent** (orchestrator) — delegates to sub-agents based on user intent
  - 1 **DataGov Search Agent** — 15 tools for data.gov.il CKAN API
  - 1 **CBS Agent** — 6 tools for CBS series, prices, and dictionary
  - 1 **Visualization Agent** — 3 chart display tools
- **New dependencies**: `@mastra/core`, `@mastra/ai-sdk`, `@mastra/memory`, `@mastra/libsql`
- **Modify API route** (`app/api/chat/route.ts`) — use `handleChatStream` from `@mastra/ai-sdk` + `createUIMessageStreamResponse` from `ai`
- **Modify frontend** (`app/page.tsx`) — add `DefaultChatTransport` to `useChat` hook
- **Simplify agent config** — remove `COMPLETION_MARKERS` and `TOOL_CALLS` (Mastra handles completion via LLM reasoning)
- **Deprecate `data-agent.ts`** — re-export routing agent for backwards compatibility

## Impact

- Affected specs: `agent-tools` (tools unchanged, but agent orchestration layer replaced)
- New spec: `agent-orchestration` (multi-agent routing, sub-agent specialization, streaming)
- Affected code:
  - `agents/` — new `network/` directory with 4 agent definitions + configs
  - `agents/mastra.ts` — new Mastra instance
  - `agents/agent.config.ts` — simplified (remove completion markers, tool call config)
  - `agents/data-agent.ts` — deprecated, re-exports from network
  - `app/api/chat/route.ts` — new streaming approach
  - `app/page.tsx` — `DefaultChatTransport` added
- `lib/tools/**` — **UNCHANGED** (tools remain in current folders)
