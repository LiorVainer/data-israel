# Design: Pre-Stream Latency Optimization

## Deployment Context: Vercel Serverless (Fluid Compute)

This project deploys on **Vercel** using **Next.js API routes** (`src/app/api/chat/route.ts`). Understanding the execution model is critical for caching:

### How Vercel Functions work
- Each API route runs as a **Vercel Function** (serverless, Node.js runtime)
- **Fluid Compute** reuses function instances across concurrent requests within the same region
- **Module-level variables persist across warm invocations** within the same instance
- Different instances (cold starts, different regions, scale-out) do NOT share in-memory state
- Default function timeout: 120s (set via `maxDuration = 120` in the route)

### Why module-level `lru-cache` works
- On **warm starts** (most requests after the first): the LRU cache retains agent instances across requests from ANY user — not tied to a single session
- On **cold starts** (new instance spin-up): cache is empty, agents are created fresh (same as current behavior, no regression)
- Vercel's Fluid Compute keeps instances alive longer and reuses them across concurrent requests, maximizing cache hit rate
- This is the **standard pattern** for caching in Vercel Functions — the same approach Vercel uses for database connection pooling, SDK clients, etc.

### What this means in practice
- A module-level `const agentCache = new LRUCache(...)` in `src/lib/cache/agent-cache.ts` survives across all requests hitting the same function instance
- User A's request creates and caches the budget agent → User B's next request (same instance) gets a cache hit
- The cache is scoped to `(agentId, modelId)` — no user-specific data is cached, agents are stateless
- Memory threads are external (Convex), so agent reuse across users is safe

### Limitations (acceptable)
- No cross-instance sharing: if Vercel scales to 3 instances, each builds its own cache independently
- Cold starts still pay the full creation cost — this optimization targets the common warm-start path
- This is inherent to any in-memory caching in serverless — Redis can't help because agents aren't serializable

## Architecture Overview

```
POST /api/chat (current)
├── await resolveModelConfig()          ← 50-200ms  (Convex query)
├── await getMastraWithModels()         ← 300-1000ms (agent creation + MCP)
├── await preSaveUserMessage()          ← 100-300ms  (Convex write)
└── handleChatStream()                  ← streaming begins

POST /api/chat (optimized)
├── await resolveModelConfig()          ← 50-200ms (with optional Redis cache: ~5ms hit)
├── await getMastraWithModels()         ← ~5ms on cache hit (LRU agent cache)
├── void preSaveUserMessage()           ← non-blocking (fire-and-forget)
└── handleChatStream()                  ← streaming begins immediately
```

## Component Design

### 1. Agent LRU Cache (`src/lib/cache/agent-cache.ts`)

```typescript
import { LRUCache } from 'lru-cache';
import type { Agent } from '@mastra/core/agent';

// Cache individual agents by composite key: `${agentId}:${modelId}`
const agentCache = new LRUCache<string, Agent>({
  max: 20,              // 8 agents x ~2-3 model variants
  ttl: 1000 * 60 * 5,   // 5-minute TTL
});

// Cache MCP tool lists separately (they're plain objects, not class instances)
const mcpToolCache = new LRUCache<string, Record<string, unknown>>({
  max: 5,               // one per MCP source
  ttl: 1000 * 60 * 10,  // 10-minute TTL (tools change rarely)
});
```

### 2. Modified `getMastraWithModels()` Flow

```
getMastraWithModels(config, enabledSources)
├── Filter agents by enabledSources
├── For each agent:
│   ├── Build cache key: `${agentId}:openrouter/${modelId}`
│   ├── Check agentCache.get(key)
│   ├── HIT  → reuse cached Agent instance
│   └── MISS → await agentDef.createAgent(modelId), cache result
├── Build routing agent (always fresh — depends on sub-agent set)
├── Create Mastra instance
└── Return (no need to cache Mastra itself — it's cheap to create)
```

**Key insight**: The Mastra instance itself is cheap to construct (~1ms). The expensive part is creating sub-agents. By caching sub-agents individually, we get fine-grained reuse regardless of `enabledSources` filter changes.

### 3. MCP Tool List Caching

```
createBudgetAgent(modelId)
├── Check mcpToolCache.get('budgetkey')
├── HIT  → use cached tool list
├── MISS → await budgetMcpClient.listTools(), cache result
└── new Agent({ tools: cachedTools, ... })
```

The MCP tool list is a plain object (Record of tool definitions). It's safe to reuse across agent instances since tools are stateless.

### 4. Deferred Pre-Save

```typescript
// Before (blocking):
await preSaveUserMessage(dynamicMastra, params.messages, threadId, memoryConfig.resource);

// After (fire-and-forget):
void preSaveUserMessage(dynamicMastra, params.messages, threadId, memoryConfig.resource)
    .catch(e => console.warn('[chat POST] preSaveUserMessage failed:', e));
```

No behavior change — the existing try/catch already logs and continues.

## Trade-offs

| Decision | Alternative | Why this way |
|----------|-------------|-------------|
| In-memory LRU (not Redis) | Redis with serialization | Agent objects are class instances, not serializable |
| Per-agent cache (not per-Mastra) | Cache whole Mastra instance | Fine-grained reuse when enabledSources differs |
| 5-min agent TTL | Infinite cache | Model config can change via admin dashboard |
| 10-min MCP tool TTL | Shorter/longer | BudgetKey tools are stable; 10 min balances freshness vs perf |
| Fire-and-forget pre-save | Remove pre-save entirely | Pre-save still protects against refresh-during-stream data loss |

## Expected Improvement

| Scenario | Before | After |
|----------|--------|-------|
| Cold start (first request) | ~450-1500ms | ~450-1500ms (no change) |
| Warm start, same config | ~50-200ms (single-entry cache hit) | ~55-205ms (LRU hits) |
| Warm start, different enabledSources | ~450-1500ms (full cache miss) | ~55-205ms (agent-level hits) |
| Warm start, model config changed for 1 agent | ~450-1500ms (full cache miss) | ~300-500ms (only changed agent recreated) |
| Pre-save overhead | +100-300ms blocking | ~0ms (non-blocking) |
