# Change: Persist enabled data sources per thread

## Why
When a user selects specific data sources via the picker, the selection resets to "all" on page refresh. Users expect the picker state to persist for a given conversation thread.

## What Changes
- New `thread_preferences` Convex table — extension table keyed by `threadId`, stores `enabledSources` array
- Convex `upsertThreadPreferences` mutation — saves picker state when user toggles sources
- Convex `getThreadPreferences` query — fetches saved state for a thread (reactive via `useQuery`)
- `ChatThread` initializes `enabledSources` from Convex on load, writes back on change

## Impact
- Affected code:
  - `convex/schema.ts` — add `thread_preferences` table
  - `convex/threads.ts` — add `upsertThreadPreferences` mutation + `getThreadPreferences` query
  - `src/components/chat/ChatThread.tsx` — read saved preferences, write on toggle
- No changes to the API route or Mastra — the picker state is purely a client-side preference stored in Convex
