# Active Context

## Current Focus
Completed implementation of `migrate-to-better-convex` OpenSpec proposal. All code tasks done (4.1-4.6), verification passed. Manual browser testing (4.7-4.9) pending.

## Recent Changes
- Installed `better-convex@0.6.1`, created `convex.json` with `staticApi: true`
- Added `strictFunctionTypes: false` to tsconfig.json
- Rewrote `convex/schema.ts` — 4 ORM tables (guests, datasets, resources, users) + 2 raw defineTable (thread_usage, thread_billing) + Mastra tables via `strict: false`
- Created `convex/lib/orm.ts` — createOrm with relations, withOrm helper
- Created `convex/lib/crpc.ts` — 3 middleware patterns (clerkAuth, optionalClerkAuth, guestAware) + 11 procedure builders
- Migrated all 5 backend function files to cRPC: guests, datasets, resources, users, threads
- Created `lib/convex/crpc.tsx` — client cRPC context with createCRPCContext
- Created `lib/convex/query-client.ts` — CRPCError-aware QueryClient factory
- Rewrote `context/ConvexClientProvider.tsx` — unified Convex + Clerk + TanStack Query + cRPC provider
- Removed `context/QueryClientProvider.tsx` (merged into ConvexClientProvider)
- Updated `app/layout.tsx` — removed separate QueryClientProvider wrapper
- Migrated all hooks: use-guest-session, use-theme-sync, use-threads-data to TanStack Query via cRPC
- Migrated components: ChatThread (useConvexQuery → useQuery), ThreadItem (useMutation → cRPC mutationOptions)
- Removed `hooks/use-query-with-status.ts` and all `convex-helpers` imports
- Generated `convex/shared/meta.ts` via `npx better-convex codegen`

## Verification Results
| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `tsc --noEmit` | 0 errors |
| Build | `npm run build` | compiled successfully, all pages generated |
| convex/react audit | grep | Only 3 allowed imports (useConvexAuth x2, ConvexReactClient x1) |
| convex-helpers audit | grep | 0 remaining imports |

## Next Steps
1. Manual browser testing (4.7-4.9): guest session, thread CRUD, theme sync, real-time, auth flows
2. Deploy Convex functions via `npx convex deploy` or `bunx better-convex dev`
3. Commit changes and create PR

## Last Updated
2026-02-19
