# Change: Persist enabled data sources per thread + user defaults

## Why
1. When a user selects specific data sources via the picker, the selection resets to "all" on page refresh. Users expect the picker state to persist for a given conversation thread.
2. Users who regularly work with a subset of sources want to set a default so every new conversation starts with their preferred sources.

## What Changes

### Thread-level persistence
- New `thread_settings` Convex table — keyed by `threadId`, stores `enabledSources` array
- `upsertThreadSettings` mutation + `getThreadSettings` query
- `ChatThread` reads saved settings on load, writes on toggle

### User-level defaults
- New `user_settings` Convex table — keyed by `userId`, stores `defaultEnabledSources` array
- `upsertUserSettings` mutation + `getUserSettings` query
- New `/settings` page — admin-style layout with inline source picker (category-grouped cards)
- NavUser sidebar menu gets "הגדרות" link to `/settings`
- New conversations initialize from user settings → then persist per-thread

### Priority chain
1. **Existing thread**: load from `thread_settings` (if exists)
2. **New thread**: load from `user_settings` (if exists)
3. **Fallback**: all sources enabled

## Impact
- Affected code:
  - `convex/schema.ts` — add `thread_settings` + `user_settings` tables
  - `convex/threads.ts` — add thread settings query/mutation
  - `convex/users.ts` — add user settings query/mutation
  - `src/app/(main)/settings/page.tsx` — NEW settings page
  - `src/components/chat/ChatThread.tsx` — read/write thread settings, initialize from user defaults
  - `src/components/navigation/NavUser.tsx` — add "הגדרות" link
