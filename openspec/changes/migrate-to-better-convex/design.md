## Context

The project uses vanilla Convex with 6 function modules (datasets, resources, threads, guests, users, search), Clerk auth, Mastra agent memory, and RAG search. Client-side uses `convex/react` hooks (`useQuery`, `useMutation`, `usePaginatedQuery` from convex-helpers). TanStack Query is already installed but only used for non-Convex purposes.

The migration replaces the backend procedure definitions and client-side hooks with better-convex, while preserving Clerk auth and all Mastra/RAG infrastructure.

## Goals / Non-Goals

- **Goals:**
  - Replace vanilla Convex functions with cRPC procedure builders
  - Replace `v` validators with Zod schemas (consistent with tool definitions)
  - Add ORM schema with relations (datasets→resources, users→thread_usage)
  - Route all client queries through TanStack Query via `crpc.*.queryOptions()`
  - Extract duplicated auth/guest resolution into middleware
  - Remove `convex-helpers` dependency for cache/pagination (replaced by TanStack Query)

- **Non-Goals:**
  - Migrate from Clerk to Better Auth
  - Rewrite RAG/search functions (they use `@convex-dev/rag` which is a Convex component)
  - Rewrite Mastra storage handler
  - Rewrite HTTP webhook handler (Clerk webhooks)
  - Rewrite sync scripts (use ConvexHttpClient, not cRPC)
  - Add RSC prefetching (can be added later)

## Decisions

### 1. Keep Clerk auth, skip Better Auth adapter

better-convex offers a Better Auth integration, but we already use Clerk with:
- `ConvexProviderWithClerk` on the client
- `auth.config.ts` for Clerk JWT verification
- HTTP webhook handler for user sync
- `ctx.auth.getUserIdentity()` in functions

**Decision**: Keep Clerk. The cRPC middleware will use `ctx.auth.getUserIdentity()` just like current code, but wrapped in reusable middleware.

### 2. Dual schema approach (ORM tables + raw Mastra tables)

Mastra tables are imported from `@mastra/convex/schema` and can't be converted to ORM format. The RAG component also uses its own tables.

**Decision**: Use `defineSchema` with `strict: false` to allow both ORM tables (guests, datasets, resources, users, thread_usage) and raw Mastra tables to coexist:

```typescript
import { convexTable, defineSchema, defineRelations } from 'better-convex/orm';
import { mastraThreadsTable, ... } from '@mastra/convex/schema';

// ORM tables
export const guests = convexTable('guests', { ... });
export const datasets = convexTable('datasets', { ... });
// ...

// Combined schema: ORM tables + raw Mastra tables
const ormTables = { guests, datasets, resources, users, thread_usage };
export default defineSchema(ormTables, {
  strict: false,
  extraTables: {
    mastra_threads: mastraThreadsTable,
    // ... other mastra tables
  },
});
```

If `defineSchema` from better-convex doesn't support `extraTables`, fall back to vanilla Convex `defineSchema` that combines both, and use a separate `defineRelations` call for ORM-only tables.

### 3. convex.json with `functions` in root (not `convex/functions`)

better-convex recommends `"functions": "convex/functions"` but our project has functions at `convex/` root (datasets.ts, resources.ts, etc.). Changing to `convex/functions/` would require moving all files and updating imports everywhere.

**Decision**: Keep functions at `convex/` root. Set `convex.json` `functions` to `"convex"` (or omit if default). The key requirement is `staticApi: true`.

### 4. Keep `ConvexHttpClient` for server-side usage

API routes (`app/api/chat/route.ts`) and sync scripts use `ConvexHttpClient` directly. cRPC's server caller requires RSC setup which is out of scope.

**Decision**: Keep `lib/convex/client.ts` with `ConvexHttpClient` for server-side. Only migrate client-side React hooks to cRPC.

### 5. Provider hierarchy with Clerk + better-convex

Current hierarchy: `ClerkProvider > ConvexProviderWithClerk > ConvexQueryCacheProvider > UserProvider`

better-convex expects: `ConvexProvider > QueryClientProvider > CRPCProvider`

**Decision**: Since we keep Clerk, use `ConvexProviderWithClerk` from `convex/react-clerk` (which is compatible with `ConvexReactClient` from `better-convex/react`), then wrap with `QueryClientProvider` and `CRPCProvider`:

```
ClerkProvider
  > ThemeProvider
    > ConvexProviderWithClerk (Clerk auth token injection)
      > QueryClientProvider (TanStack Query - merge existing)
        > CRPCProvider (better-convex cRPC context)
          > UserProvider
```

Remove `ConvexQueryCacheProvider` (TanStack Query handles caching now).

### 6. Actions remain vanilla Convex

cRPC procedures support `.action()`, but our actions (`search.ts`) use `@convex-dev/rag` which requires the raw Convex `ActionCtx`. RAG's `search` and `add` methods expect vanilla Convex context.

**Decision**: Keep `convex/search.ts` actions as vanilla Convex. Only migrate queries and mutations to cRPC.

### 7. Relations

Add the following ORM relations:
- `datasets` → `resources`: one-to-many (via `resources.datasetId`)
- `users` → `thread_usage`: one-to-many (via `thread_usage.userId`)

These enable `ctx.orm.query.datasets.findMany({ with: { resources: true } })` for eager loading.

### 8. Auth/Guest Middleware Architecture (eliminating 7 duplicated patterns)

Currently `ctx.auth.getUserIdentity()` is called 7 times across `threads.ts` (5x) and `users.ts` (2x) with 3 distinct patterns. cRPC middleware eliminates all duplication.

**Pattern A — Auth Required (strict)**: Used by `users.updateThemePreference`
- Throws `CRPCError({ code: 'UNAUTHORIZED' })` if no Clerk identity
- Provides `ctx.identity` (Clerk UserIdentity) and `ctx.clerkUserId` (subject)

**Pattern B — Auth Optional (soft)**: Used by `users.getCurrentUser`, `threads.getAuthResourceId`
- Returns `ctx.identity = null` if unauthenticated (no error)
- Procedures check `ctx.identity` themselves

**Pattern C — Guest-Aware (auth OR guest)**: Used by 4 thread procedures (`listUserThreads`, `listUserThreadsPaginated`, `deleteThread`, `renameThread`)
- Resolves `ctx.resourceId` from either `identity.subject` or `guestId` input
- Throws if neither is available
- This is the most duplicated pattern (4 instances of identical logic)

**Middleware design in `convex/lib/crpc.ts`:**

```typescript
import { CRPCError, initCRPC } from 'better-convex/server';

// --- Middleware A: Auth Required (Clerk) ---
const clerkAuthMiddleware = c.middleware(async ({ ctx, next }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new CRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({
    ctx: { ...ctx, identity, clerkUserId: identity.subject },
  });
});

// --- Middleware B: Auth Optional (Clerk) ---
const optionalClerkAuthMiddleware = c.middleware(async ({ ctx, next }) => {
  const identity = await ctx.auth.getUserIdentity();
  return next({
    ctx: {
      ...ctx,
      identity: identity ?? null,
      clerkUserId: identity?.subject ?? null,
    },
  });
});

// --- Middleware C: Guest-Aware (auth OR guest) ---
// This middleware reads `guestId` from input (placed AFTER .input())
const guestAwareMiddleware = c.middleware(async ({ ctx, input, next }) => {
  const identity = await ctx.auth.getUserIdentity();
  const guestId = (input as { guestId?: string })?.guestId;
  const resourceId = identity?.subject ?? guestId;

  if (!resourceId) {
    throw new CRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated and no guest ID provided',
    });
  }

  return next({
    ctx: { ...ctx, identity: identity ?? null, resourceId },
  });
});

// --- Procedure builders ---
export const publicQuery = c.query;
export const publicMutation = c.mutation;

export const authQuery = c.query.use(clerkAuthMiddleware);
export const authMutation = c.mutation.use(clerkAuthMiddleware);

export const optionalAuthQuery = c.query.use(optionalClerkAuthMiddleware);

// guestAwareQuery/Mutation are used AFTER .input() that includes guestId
export const guestAwareQuery = c.query.use(guestAwareMiddleware);
export const guestAwareMutation = c.mutation.use(guestAwareMiddleware);

export const privateQuery = c.query.internal();
export const privateMutation = c.mutation.internal();
```

**Usage mapping:**

| Current Function | Current Pattern | New Builder | ctx Available |
|---|---|---|---|
| `users.updateThemePreference` | Auth required, throws | `authMutation` | `ctx.identity`, `ctx.clerkUserId` |
| `users.getCurrentUser` | Auth optional, null | `optionalAuthQuery` | `ctx.identity` (nullable) |
| `threads.getAuthResourceId` | Auth optional, null | `optionalAuthQuery` | `ctx.identity` (nullable) |
| `threads.listUserThreads` | Auth OR guest | `guestAwareQuery` | `ctx.resourceId` |
| `threads.listUserThreadsPaginated` | Auth OR guest | `guestAwareQuery` | `ctx.resourceId` |
| `threads.deleteThread` | Auth OR guest | `guestAwareMutation` | `ctx.resourceId` |
| `threads.renameThread` | Auth OR guest | `guestAwareMutation` | `ctx.resourceId` |
| `threads.insertThreadUsage` | Public (no auth) | `publicMutation` | — |
| `threads.getThreadCumulativeUsage` | Public (no auth) | `publicQuery` | — |
| `guests.*` | Public (no auth) | `publicQuery`/`publicMutation` | — |
| `datasets.*` | Public (no auth) | `publicQuery`/`publicMutation` | — |
| `resources.*` | Public (no auth) | `publicQuery`/`publicMutation` | — |
| `users.upsertFromClerk` | Internal (webhook) | `privateMutation` (vanilla) | — |
| `users.deleteByClerkId` | Internal (webhook) | `privateMutation` (vanilla) | — |
| `datasets.batchInsert` | Internal (sync) | `privateMutation` (vanilla) | — |
| `resources.batchInsert` | Internal (sync) | `privateMutation` (vanilla) | — |

### 9. QueryClient with CRPCError-Aware Retry Logic

better-convex best practices recommend a smart QueryClient that:
- Does NOT retry deterministic CRPCErrors (auth, validation — HTTP 4xx)
- DOES retry transient errors (timeouts) up to 3 times with exponential backoff
- Shows toast notifications for mutation errors
- Uses `staleTime: Infinity` (Convex WebSocket handles freshness)

```typescript
import { isCRPCError, isCRPCClientError } from 'better-convex/crpc';

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isCRPCClientError(error)) {
          console.warn(`[CRPC] ${error.code}:`, error.functionName);
        }
      },
    }),
    defaultOptions: {
      mutations: {
        onError: (err) => {
          const error = err as Error & { data?: { message?: string } };
          toast.error(error.data?.message || error.message);
        },
      },
      queries: {
        staleTime: Infinity, // Convex handles freshness via WebSocket
        retry: (failureCount, error) => {
          if (isCRPCError(error)) return false; // Don't retry auth/validation errors
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes('timed out') && failureCount < 3) return true;
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 30_000),
      },
    },
  });
}
```

### 10. Environment Variables

better-convex requires `NEXT_PUBLIC_CONVEX_SITE_URL` for the cRPC client context (used for HTTP-based RPC calls). This is the Convex HTTP actions URL, different from the WebSocket URL.

- `NEXT_PUBLIC_CONVEX_URL` — WebSocket URL (already exists): `https://decisive-alpaca-889.convex.cloud`
- `NEXT_PUBLIC_CONVEX_SITE_URL` — HTTP actions URL (new): typically `https://decisive-alpaca-889.convex.site`

## Risks / Trade-offs

- **Risk**: `better-convex` ORM schema may not support Convex `v.id()` foreign key types directly
  - *Mitigation*: Use `id('tableName')` from `better-convex/orm` which maps to `v.id()`

- **Risk**: `ConvexProviderWithClerk` may not be compatible with `ConvexReactClient` from `better-convex/react`
  - *Mitigation*: If incompatible, use vanilla `ConvexReactClient` from `convex/react` and handle auth token injection manually via `convex.setAuth()`

- **Risk**: `convex-helpers` removal may break other code using its utilities
  - *Mitigation*: Only remove cache provider and paginated query helpers. Keep `convex-helpers` as dependency if other utilities are used (triggers, etc.)

- **Risk**: `strictFunctionTypes: false` in tsconfig may loosen type safety elsewhere
  - *Mitigation*: This is the recommended setting from better-convex for middleware inference. Monitor for regressions.

## Migration Plan

### Phase 1: Backend foundation (no client changes)
1. Install `better-convex`, add `convex.json`
2. Create `convex/lib/crpc.ts` (cRPC init) and `convex/lib/orm.ts`
3. Rewrite `convex/schema.ts` to ORM format with relations
4. Run `bunx better-convex dev` to generate metadata

### Phase 2: Migrate functions to cRPC
5. Migrate `convex/guests.ts` → cRPC procedures
6. Migrate `convex/datasets.ts` → cRPC procedures
7. Migrate `convex/resources.ts` → cRPC procedures
8. Migrate `convex/users.ts` → cRPC procedures (keep internal mutations vanilla for webhooks)
9. Migrate `convex/threads.ts` → cRPC procedures
10. Verify all procedures work via `better-convex dev`

### Phase 3: Client migration
11. Create `lib/convex/crpc.tsx` (client cRPC context)
12. Rewrite `context/ConvexClientProvider.tsx` with better-convex provider
13. Migrate hooks one by one (guest-session, theme-sync, threads-data)
14. Migrate component-level queries (ChatThread, ThreadItem)
15. Remove `hooks/use-query-with-status.ts` (replaced by TanStack Query)
16. Clean up unused convex-helpers imports

### Phase 4: Verification
17. Run `npm run build`, `npm run lint`, `tsc`
18. Test all user flows in browser
19. Verify real-time updates still work (WebSocket subscriptions)

### Rollback
All Convex function changes are deployed atomically. If issues arise:
1. Revert the `convex/` directory changes
2. Revert client-side provider/hook changes
3. Run `npx convex dev` to redeploy vanilla functions

## Open Questions

1. Does `better-convex` ORM's `defineSchema` support mixing ORM tables with raw `defineTable` tables (Mastra imports)?
2. Does `ConvexProviderWithClerk` work with `ConvexReactClient` from `better-convex/react`, or only from `convex/react`?
3. Does cRPC support `internalMutation` (used by Clerk webhook handler for `users.upsertFromClerk`)?
4. Does `paginationOptsValidator` from `convex/server` work with cRPC's `.input()`, or do we need cursor-based pagination via `.paginated()`?
