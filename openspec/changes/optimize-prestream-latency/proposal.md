# Optimize Pre-Stream Latency

## Change ID
`optimize-prestream-latency`

## Summary

Reduce the delay between message submission ("submitted" state) and first streaming token ("loading" / "טוען") by eliminating blocking operations before `handleChatStream` and adding LRU-based caching for agent instances and MCP tool lists.

## Problem

The `POST /api/chat` handler currently executes three sequential `await` calls before streaming begins:

1. `resolveModelConfig()` — Convex query (~50-200ms)
2. `getMastraWithModels()` — creates all sub-agents, including async MCP tool discovery (~300-1000ms+)
3. `preSaveUserMessage()` — Convex thread creation + message save (~100-300ms)

**Total blocking time: ~450-1500ms** before the user sees any loading indicator.

The current caching in `mastra.ts` is a single-entry cache keyed by `JSON.stringify({ config, enabledSources })`. Any change to model config or enabled sources invalidates the entire cache, requiring full agent re-creation — including the expensive `budgetMcpClient.listTools()` HTTP call.

## Research Findings

### Redis is NOT suitable for agent caching
- Upstash Redis (HTTP-based `@upstash/redis`) serializes values to strings
- Mastra `Agent` objects are class instances with methods, closures, and internal state — not serializable
- Redis is only useful for cache invalidation signals or serializable metadata

### `lru-cache` is the right tool
- 318M weekly downloads, by Isaac Z. Schlueter (npm creator)
- Stores raw JavaScript references — class instances work natively
- TTL + LRU eviction built-in, TypeScript-first
- Module-level singletons survive across warm starts in Next.js serverless

### What's actually expensive
| Operation | Sync/Async | Cost |
|-----------|-----------|------|
| `createCbsAgent()` | Sync | Cheap (~1ms) |
| `createDatagovAgent()` | Sync | Cheap (~1ms) |
| `createGovmapAgent()` | Sync | Cheap (~1ms) |
| `createHealthAgent()` | Sync | Cheap (~1ms) |
| `createKnessetAgent()` | Sync | Cheap (~1ms) |
| `createShufersalAgent()` | Sync | Cheap (~1ms) |
| `createRamiLevyAgent()` | Sync | Cheap (~1ms) |
| `createBudgetAgent()` | **Async** | **Expensive** — HTTP to `https://next.obudget.org/mcp` |
| `preSaveUserMessage()` | Async | Moderate — Convex writes |
| `resolveModelConfig()` | Async | Moderate — Convex query |

### Agent reusability
- Agents are keyed by `(agentId, modelId)` — same model = same agent
- Tools are pure functions, memory threads are external (per-request threadId)
- Agents can be safely reused across requests when the model ID matches

## Solution

### 1. Defer `preSaveUserMessage()` (fire-and-forget)
Move pre-save out of the blocking path. It already has error handling and Convex upserts are idempotent.

### 2. LRU cache for individual sub-agents
Cache agents by `(agentId, modelId)` key using `lru-cache`. When `enabledSources` changes, only the filter changes — cached agents are reused. Budget agent with its expensive MCP lookup survives across requests.

### 3. TTL-based MCP tool list cache
Cache `budgetMcpClient.listTools()` results with a 10-minute TTL. MCP tool lists rarely change (endpoint is stable). This eliminates the HTTP roundtrip on most requests.

### 4. Parallel `resolveModelConfig` + model config Redis cache (optional)
Cache the model config in Redis with short TTL (30s) to avoid Convex query on every request. Falls back to Convex on cache miss.

## Scope

- `src/agents/mastra.ts` — replace single-entry cache with LRU agent cache
- `src/data-sources/budget/budget.agent.ts` — add MCP tool list caching
- `src/app/api/chat/route.ts` — defer `preSaveUserMessage`
- `src/lib/cache/agent-cache.ts` — new: shared LRU cache utility
- `package.json` — add `lru-cache` dependency

## Out of Scope

- Redis-based caching for agent instances (not serializable)
- Changes to agent memory or thread management
- UI changes

## Deployment: Vercel Serverless (Fluid Compute)

This project deploys on **Vercel** using Next.js API routes. The caching strategy relies on **module-level singletons** — the standard Vercel pattern for reusing objects across warm invocations:

- **Warm starts (common)**: Module-level `lru-cache` persists across ALL requests from ANY user hitting the same function instance. Agent instances are stateless (memory threads are external in Convex), so cross-user reuse is safe.
- **Cold starts**: Cache is empty, full agent creation cost is paid (same as today, no regression).
- **Fluid Compute**: Vercel reuses function instances across concurrent requests, maximizing cache hit rate.
- **No cross-instance sharing**: Each function instance has its own cache. This is inherent to in-memory caching in serverless and acceptable — Redis can't help because Agent objects are class instances (not serializable).

This is the same pattern Vercel recommends for database connection pooling and SDK client reuse.

## Risks

- **Stale MCP tools**: If BudgetKey adds/removes tools, the 10-min TTL delays discovery. Acceptable for a stable endpoint.
- **Memory growth**: LRU max bound (20 entries) + TTL (5 min) prevents unbounded growth. With 8 agents x ~2 model variants = ~16 entries max.
- **Deferred pre-save race**: If user refreshes before pre-save completes AND before `executeOnFinish`, the message is lost. This is the existing behavior — pre-save is a best-effort improvement, not a guarantee.
- **Cold start unchanged**: First request to a new Vercel function instance still pays full creation cost. This optimization only improves the warm-start path (which is the majority of requests under Fluid Compute).
