# Tasks: optimize-prestream-latency

## 1.0 Add `lru-cache` dependency
- [x] Install `lru-cache` package
- [x] Verify TypeScript types are included (built-in, no `@types` needed)

## 2.0 Create agent cache utility
- [x] Create `src/lib/cache/agent-cache.ts` with LRU cache for Agent instances (max: 20, TTL: 5 min)
- [x] Create MCP tool list cache (max: 5, TTL: 10 min)
- [x] Export `getOrCreateAgent()` helper that checks cache before calling factory
- [x] Export `getOrFetchMcpTools()` helper for MCP tool caching

## 3.0 Integrate MCP tool caching into budget agent
- [x] Modify `createBudgetAgent()` to use `getOrFetchMcpTools('budgetkey', () => budgetMcpClient.listTools())`
- [ ] Verify budget agent still works with cached tools (manual test)

## 4.0 Refactor `getMastraWithModels()` to use agent cache
- [x] Replace single-entry `cachedConfigKey`/`cachedMastra` with per-agent LRU cache lookups
- [x] Build cache key as `${agentId}:${modelId}` for each sub-agent
- [x] Keep Mastra instance creation (cheap) — only cache sub-agents
- [x] Remove old single-entry cache variables

## 5.0 Defer `preSaveUserMessage()` in route handler
- [x] Change `await preSaveUserMessage(...)` to `void preSaveUserMessage(...).catch(...)`
- [x] Keep existing error logging

## 6.0 Verify and test
- [x] Run `tsc` — no type errors
- [x] Run `npm run lint` — no lint errors
- [x] Run `npm run build` — production build succeeds
- [ ] Manual test: send message, verify reduced delay between submit and first token
- [ ] Manual test: verify budget agent tools still work (MCP cache)
- [ ] Manual test: change enabledSources, verify correct agent filtering
- [ ] Manual test: change model config via admin, verify agents pick up new model after TTL
