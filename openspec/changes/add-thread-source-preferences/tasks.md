## 1. Convex: thread_preferences table + functions
- [ ] 1.1 Add `thread_preferences` table to `convex/schema.ts` with `threadId` (string, indexed), `enabledSources` (array of strings), `updatedAt` (number)
- [ ] 1.2 Add `getThreadPreferences` query to `convex/threads.ts` — returns `enabledSources` or null
- [ ] 1.3 Add `upsertThreadPreferences` mutation to `convex/threads.ts` — upserts by threadId

## 2. ChatThread: persist and restore picker state
- [ ] 2.1 Subscribe to `getThreadPreferences` via `useQuery` with the thread `id`
- [ ] 2.2 Initialize `enabledSources` from saved preferences when loaded (or default to all)
- [ ] 2.3 Call `upsertThreadPreferences` mutation on toggle/selectAll/unselectAll (debounced or immediate)
- [ ] 2.4 Skip saving when all sources are selected (treat as default — no record needed)

## 3. Verification
- [ ] 3.1 `tsc` passes
- [ ] 3.2 Manual: pick sources, refresh page, picker state restored
- [ ] 3.3 Manual: new thread starts with all sources (no stale preference)
