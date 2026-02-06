# Implementation Tasks: ResourceId Resolution via Convex Auth

## 1. Convex Backend

- [x] 1.1 Add `getAuthResourceId` query to `convex/threads.ts` using `ctx.auth.getUserIdentity()`
- [x] 1.2 `listUserThreads` already uses `ctx.auth.getUserIdentity()` for authenticated users and accepts `guestId` for guests

## 2. Chat Page (Client-Side Auth)

- [x] 2.1 Simplified `app/(main)/chat/[id]/page.tsx` — Server Component now just renders `ChatThread`
- [x] 2.2 Updated `ChatThread` to:
  - Call `useQuery(api.threads.getAuthResourceId)` to resolve Clerk subject (auto-attaches token via `ConvexProviderWithClerk`)
  - Compute `resourceId` priority: Clerk subject > guestId > session fallback > default
  - Fetch initial messages client-side from `/api/chat?threadId=...&resourceId=...`
  - Use `setMessages` to hydrate after fetch

## 3. ThreadsSidebarGroup Update

- [x] 3.1 Updated `ThreadsSidebarGroup` to use `guestId` parameter for `listUserThreads` instead of computed `resourceId`
- [x] 3.2 For authenticated users, `listUserThreads` resolves identity via `ctx.auth.getUserIdentity()`

## 4. Verification

- [x] 4.1 Run `tsc` — no TypeScript errors
- [x] 4.2 Run `npm run build` — build succeeds
- [ ] 4.3 Test authenticated user: navigate to `/chat/:id` → messages should load client-side with correct resourceId
- [ ] 4.4 Test guest user: navigate to `/chat/:id` → messages load with guestId
