# Change: Migrate Convex backend to better-convex

## Why

The project currently uses vanilla Convex with raw `ctx.db` calls, `v` validators, and `convex/react` hooks. Migrating to **better-convex** gives us:

- **tRPC-style procedure builders** (`.input()` / `.use()` / `.query()`) replacing verbose `query({ args, handler })` definitions
- **Drizzle-like ORM** (`ctx.orm.query.table.findMany()`) replacing raw `ctx.db.query('table').withIndex(...)` chains
- **TanStack Query integration** (`useQuery(crpc.threads.list.queryOptions(...))`) replacing `useQuery(api.threads.listUserThreads, args)` from `convex/react`
- **Zod validation** replacing `v` validators, aligning with the rest of the codebase (tools already use Zod)
- **Relations** between tables (datasets-resources, users-thread_usage) enabling eager loading with `with: { resources: true }`
- **Middleware** for reusable auth/guest resolution, replacing duplicated `ctx.auth.getUserIdentity()` in every function

## What Changes

### Backend (convex/)
- **Schema**: Migrate from `defineTable` + `v` validators to `convexTable` + better-convex ORM field types + `defineRelations`
- **Functions**: Rewrite all queries/mutations/actions as cRPC procedures with Zod `.input()` validation
- **Auth middleware**: Extract duplicated `ctx.auth.getUserIdentity()` + guest resolution into reusable middleware
- **Mastra tables**: Keep as-is (imported from `@mastra/convex/schema`, not migrated)
- **RAG/search**: Keep as-is (uses `@convex-dev/rag`, actions remain vanilla Convex)
- **HTTP routes**: Keep Clerk webhook handler as-is (vanilla `httpAction`)

### Client (hooks/, components/, context/)
- **Provider**: Replace `ConvexProviderWithClerk` + `ConvexQueryCacheProvider` with better-convex `ConvexReactClient` + `CRPCProvider` (keeping Clerk auth via `ConvexProviderWithClerk`)
- **Hooks**: Replace `useQuery`/`useMutation` from `convex/react` with `useQuery`/`useMutation` from `@tanstack/react-query` using `crpc.*.queryOptions()`
- **convex-helpers**: Remove `ConvexQueryCacheProvider`, `usePaginatedQuery`, `useQueries` (replaced by TanStack Query equivalents)

### Config
- Add `convex.json` with `staticApi: true` for cRPC type inference
- Add `strictFunctionTypes: false` to `tsconfig.json` for middleware type inference
- Install `better-convex` package

### NOT Changed
- **Clerk auth**: Stays as-is (no migration to Better Auth)
- **Mastra storage**: `convex/mastra/storage.ts` untouched
- **RAG component**: `convex/rag.ts`, `convex/search.ts`, `convex/convex.config.ts` untouched
- **Server-side ConvexHttpClient**: `lib/convex/client.ts` kept for API route usage
- **Sync scripts**: `scripts/sync-to-convex.ts` untouched (uses ConvexHttpClient)

## Impact
- Affected specs: `agent-tools` (tools reference Convex types)
- Affected code:
  - `convex/schema.ts` — Full rewrite to ORM schema
  - `convex/datasets.ts` — Rewrite to cRPC procedures
  - `convex/resources.ts` — Rewrite to cRPC procedures
  - `convex/threads.ts` — Rewrite to cRPC procedures
  - `convex/guests.ts` — Rewrite to cRPC procedures
  - `convex/users.ts` — Rewrite to cRPC procedures
  - `convex/lib/crpc.ts` — New: cRPC init + middleware
  - `convex/lib/orm.ts` — New: ORM setup
  - `context/ConvexClientProvider.tsx` — Rewrite to better-convex provider
  - `context/QueryClientProvider.tsx` — Merge into ConvexClientProvider
  - `hooks/use-guest-session.ts` — Migrate to TanStack Query
  - `hooks/use-theme-sync.ts` — Migrate to TanStack Query
  - `hooks/use-threads-data.ts` — Migrate to TanStack Query
  - `hooks/use-query-with-status.ts` — Remove (TanStack Query has built-in status)
  - `components/chat/ChatThread.tsx` — Migrate useQuery
  - `components/threads/ThreadItem.tsx` — Migrate useMutation
  - `lib/convex/crpc.tsx` — New: client-side cRPC context
