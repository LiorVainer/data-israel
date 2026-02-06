## Context

The chat page needed to resolve the correct `resourceId` for recalling messages from Mastra memory. Previously it guessed with `'default-user'`, which never matched real data.

The project already has:
- Clerk auth configured with Convex JWT template (`convex/auth.config.ts`)
- `ConvexProviderWithClerk` on the client (auto-attaches Clerk tokens to Convex calls)
- `useConvexAuth()` for auth state in client components

## Goals / Non-Goals

**Goals:**
- Resolve the authenticated user's canonical `resourceId` using Convex's `ctx.auth.getUserIdentity()`
- Load correct initial messages for authenticated users
- Maintain graceful fallback for guests (guestId or session-based)

**Non-Goals:**
- Server-side message hydration (requires middleware complexity)
- Unifying resourceId computation across all API routes (follow-up)

## Decisions

### Decision 1: Client-Side Auth Resolution (No Middleware)

**Why:** `ConvexProviderWithClerk` already auto-attaches Clerk JWT tokens to all Convex queries. Adding a new Convex query (`getAuthResourceId`) that calls `ctx.auth.getUserIdentity()` works seamlessly client-side without requiring `middleware.ts`.

**Alternative considered:** Using `fetchQuery` from `convex/nextjs` with manual token via `auth().getToken()` in the Server Component. Rejected because it requires adding `clerkMiddleware()` to enable `auth()` in Server Components.

### Decision 2: Client-Side Message Fetching

The `ChatThread` client component:
1. Calls `useQuery(api.threads.getAuthResourceId)` to get Clerk subject (or `null`)
2. Computes final resourceId (Clerk subject > guestId > session > default)
3. Fetches messages from `/api/chat?threadId=...&resourceId=...` via `useEffect`
4. Uses `setMessages` from `useChat` to hydrate

This adds a brief loading state but avoids middleware complexity.

### Decision 3: Simplified Server Component

The Server Component (`page.tsx`) is now minimal — just renders `ChatThread` with the thread `id`. All auth resolution and message fetching happens client-side.

## Risks / Trade-offs

- **Extra client-side fetch** — messages load after component mounts (brief flash). Acceptable trade-off for avoiding middleware complexity.
- **No server-side hydration** — authenticated users see loading state briefly. Could be improved with middleware in the future.

## Open Questions

None — implementation complete.
