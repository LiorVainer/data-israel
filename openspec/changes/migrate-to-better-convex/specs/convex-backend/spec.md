## MODIFIED Requirements

### Requirement: Convex Schema Definition
The system SHALL define database tables using better-convex ORM (`convexTable`) with typed field definitions and `defineRelations` for table relationships. Mastra tables SHALL remain as raw `defineTable` imports. The schema SHALL use `strict: false` to allow both ORM and raw tables to coexist.

#### Scenario: ORM schema with relations
- **WHEN** the schema is defined
- **THEN** `datasets` and `resources` tables use `convexTable` with ORM field types
- **AND** a one-to-many relation is defined from `datasets` to `resources` via `datasetId`
- **AND** a one-to-many relation is defined from `users` to `thread_usage` via `userId`
- **AND** Mastra tables (`mastra_threads`, `mastra_messages`, etc.) are preserved as raw imports

### Requirement: Convex Function Definitions
The system SHALL define public queries and mutations as cRPC procedures using better-convex's tRPC-style builder API (`.input()` with Zod, `.query()` / `.mutation()`). Internal mutations (Clerk webhooks, batch operations) SHALL remain as vanilla Convex `internalMutation`. RAG search actions SHALL remain as vanilla Convex `action`.

#### Scenario: cRPC procedure with Zod validation
- **WHEN** a public query or mutation is defined
- **THEN** it uses cRPC procedure builder (e.g., `publicQuery.input(z.object({...})).query(...)`)
- **AND** input is validated with Zod schemas
- **AND** the handler receives `{ ctx, input }` instead of `(ctx, args)`
- **AND** `ctx.orm` is available for ORM-style queries

#### Scenario: Internal mutation stays vanilla
- **WHEN** a function is called only from Convex backend (webhooks, batch scripts)
- **THEN** it uses vanilla Convex `internalMutation` (not cRPC)

### Requirement: Auth and Guest Middleware
The system SHALL provide reusable cRPC middleware for resolving authenticated users and guest sessions, replacing duplicated `ctx.auth.getUserIdentity()` calls across functions.

#### Scenario: Auth middleware resolves user identity
- **WHEN** a procedure uses auth middleware
- **THEN** `ctx.user` (Clerk identity) and `ctx.userId` (subject) are available in the handler
- **AND** unauthenticated requests receive a meaningful error or null user

#### Scenario: Guest-aware middleware
- **WHEN** a procedure accepts optional `guestId` input
- **THEN** middleware resolves `resourceId` from either Clerk identity or guest ID
- **AND** the handler receives a consistent `ctx.resourceId` regardless of auth method

## ADDED Requirements

### Requirement: TanStack Query Client Integration
The system SHALL route all client-side Convex queries and mutations through TanStack Query via better-convex's cRPC `queryOptions()` and `mutationOptions()` methods. Convex WebSocket subscriptions SHALL flow into TanStack Query cache for real-time updates.

#### Scenario: Query uses cRPC queryOptions
- **WHEN** a component needs Convex data
- **THEN** it uses `useQuery(crpc.module.fn.queryOptions(args))` from `@tanstack/react-query`
- **AND** data is real-time (updated via Convex WebSocket subscription)
- **AND** TanStack Query provides `isPending`, `isError`, `data` states

#### Scenario: Mutation uses cRPC mutationOptions
- **WHEN** a component needs to write Convex data
- **THEN** it uses `useMutation(crpc.module.fn.mutationOptions())` from `@tanstack/react-query`

#### Scenario: Paginated query uses infinite query
- **WHEN** a component needs paginated Convex data (e.g., thread list)
- **THEN** it uses `useInfiniteQuery` from `@tanstack/react-query` with cRPC pagination

### Requirement: cRPC Client Provider
The system SHALL provide a `CRPCProvider` React context that wraps the application, enabling `useCRPC()` hook access in all components. The provider SHALL integrate with the existing Clerk auth and Convex WebSocket connection.

#### Scenario: Provider hierarchy with Clerk auth
- **WHEN** the app renders
- **THEN** `ClerkProvider` wraps `ConvexProviderWithClerk` wraps `QueryClientProvider` wraps `CRPCProvider`
- **AND** auth tokens from Clerk are injected into Convex client
- **AND** TanStack QueryClient uses `staleTime: Infinity` (Convex handles freshness)
