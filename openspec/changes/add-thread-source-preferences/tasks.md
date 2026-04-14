## 1. Convex: thread_settings table + functions
- [x] 1.1 Add `thread_settings` table to `convex/schema.ts` with `threadId` (string, indexed), `enabledSources` (array of strings), `updatedAt` (number)
- [x] 1.2 Add `getThreadSettings` query to `convex/threads.ts` — returns `enabledSources` or null
- [x] 1.3 Add `upsertThreadSettings` mutation to `convex/threads.ts` — upserts by threadId
- [x] 1.4 Add delete logic: when all sources selected, remove the record (default = no record)

## 2. Convex: user_settings table + functions
- [x] 2.1 Add `user_settings` table to `convex/schema.ts` with `userId` (string, indexed), `defaultEnabledSources` (array of strings), `updatedAt` (number)
- [x] 2.2 Add `getUserSettings` query to `convex/users.ts` — returns `defaultEnabledSources` or null
- [x] 2.3 Add `upsertUserSettings` mutation to `convex/users.ts` — upserts by userId
- [x] 2.4 Run `npx convex dev` to regenerate `convex/_generated/api`

## 3. ChatThread: persist and restore picker state
- [x] 3.1 Subscribe to `getThreadSettings` via `useQuery` with thread `id`
- [x] 3.2 Subscribe to `getUserSettings` via `useQuery` with `userId`
- [x] 3.3 Initialize `enabledSources` priority: thread settings → user settings → all sources
- [x] 3.4 Call `upsertThreadSettings` on toggle/selectAll/unselectAll
- [x] 3.5 On new thread first message, copy current enabledSources to thread_settings

## 4. Settings page
- [x] 4.1 Create `src/app/(main)/settings/page.tsx` — admin-style layout (centered, max-w-5xl, RTL)
- [x] 4.2 Page header: "הגדרות" title + "מקורות מידע ברירת מחדל" subtitle
- [x] 4.3 Inline source picker: category-grouped cards (reuse `groupedByCategory` + `DATA_SOURCES_CATEGORIES` from DataSourcePicker) — NOT a popover, rendered directly on page in a bordered card like admin model cards
- [x] 4.4 Each source row: icon + label + urlLabel + toggle/checkmark (same style as DataSourcePicker CommandItem)
- [x] 4.5 Select all / unselect all buttons at top of card
- [x] 4.6 Footer status text showing current selection count
- [x] 4.7 Save via `upsertUserSettings` on each toggle (immediate, no save button)

## 5. NavUser: add settings link
- [x] 5.1 Add "הגדרות" menu item to NavUser dropdown (Settings icon, for both signed-in and signed-out users)
- [x] 5.2 Auto-close sidebar on click, navigate to `/settings`

## 6. Verification
- [x] 6.1 `tsc` passes
- [ ] 6.2 Manual: set user defaults on settings page → new thread uses them
- [ ] 6.3 Manual: change sources in thread → refresh → thread settings restored
- [ ] 6.4 Manual: thread settings override user settings for existing thread
- [ ] 6.5 Manual: guest user (no auth) → falls back to all sources
