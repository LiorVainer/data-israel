# Change: Resolve resourceId from Convex Auth (Client-Side)

## Why

The chat page Server Component (`app/(main)/chat/[id]/page.tsx`) was using a hardcoded `DEFAULT_RESOURCE_ID` (`'default-user'`) for recalling thread messages via Mastra memory. This caused:

1. **Authenticated users see empty threads** — messages stored under Clerk subject, but server fetched with `'default-user'`
2. **resourceId inconsistency** — different components computed resourceId differently

The fix: use `ctx.auth.getUserIdentity()` inside Convex queries to resolve the canonical resourceId, relying on `ConvexProviderWithClerk` for automatic token handling.

## What Changes

### Convex Backend
- **Added `getAuthResourceId` query** in `convex/threads.ts` — returns Clerk `subject` or `null` for unauthenticated users
- **`listUserThreads` already uses `ctx.auth.getUserIdentity()`** for authenticated users

### Chat Page (Client-Side Approach)
- **Simplified Server Component** — `page.tsx` now just renders `ChatThread` (no server-side message hydration)
- **Updated `ChatThread`** to:
  - Call `useQuery(api.threads.getAuthResourceId)` (token auto-attached via `ConvexProviderWithClerk`)
  - Compute resourceId priority: Clerk subject > guestId > session > default
  - Fetch initial messages client-side via `/api/chat?threadId=...&resourceId=...`

### ThreadsSidebarGroup
- Updated to pass `guestId` to `listUserThreads` for guest users (authenticated users resolved via `ctx.auth`)

## Impact

- Affected code:
  - `convex/threads.ts` — added `getAuthResourceId` query
  - `app/(main)/chat/[id]/page.tsx` — simplified to just render `ChatThread`
  - `components/chat/ChatThread.tsx` — uses Convex query for resourceId, fetches messages client-side
  - `components/threads/ThreadsSidebarGroup.tsx` — uses `guestId` parameter
- **No middleware required** — `ConvexProviderWithClerk` handles auth tokens automatically for client-side Convex calls
- **No breaking changes** — graceful fallback for guests
