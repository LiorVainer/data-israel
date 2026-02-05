## ADDED Requirements

### Requirement: Server-Side Resource Identity Resolution

The system SHALL provide a Convex query (`getAuthResourceId`) that resolves the authenticated user's canonical resource identifier using `ctx.auth.getUserIdentity()`.

The query SHALL return the Clerk user's `subject` claim (string) when the user is authenticated, or `null` when no valid authentication is present.

#### Scenario: Authenticated user identity resolved
- **WHEN** a Convex query is called with a valid Clerk JWT token
- **THEN** the query returns the user's Clerk `subject` (user ID string) from `ctx.auth.getUserIdentity()`

#### Scenario: Unauthenticated request
- **WHEN** a Convex query is called without a valid auth token
- **THEN** the query returns `null`

### Requirement: Server Component Message Hydration with Auth

The chat page Server Component SHALL resolve the user's `resourceId` from Convex auth before recalling Mastra memory messages.

For authenticated users, the Server Component SHALL use Clerk's `auth()` to obtain a Convex JWT token and call the `getAuthResourceId` Convex query via `fetchQuery`.

For unauthenticated users (guests), the Server Component SHALL pass empty initial messages and defer hydration to the client component.

#### Scenario: Authenticated user sees correct messages on page load
- **WHEN** an authenticated user navigates to `/chat/:id`
- **THEN** the Server Component resolves their Clerk `subject` as `resourceId` via the Convex query
- **AND** recalls messages from Mastra memory using that `resourceId`
- **AND** passes the hydrated messages to `ChatThread` as `initialMessages`

#### Scenario: Guest user gets client-side hydration
- **WHEN** a guest (unauthenticated) user navigates to `/chat/:id`
- **THEN** the Server Component passes empty `initialMessages` to `ChatThread`
- **AND** the client component fetches messages using the guest's `resourceId` from `UserContext`

### Requirement: Clerk Middleware for Server Component Auth

The application SHALL include a `middleware.ts` with `clerkMiddleware()` to enable Clerk's `auth()` helper in Server Components.

The middleware SHALL be configured as a pass-through (no route protection) to maintain the current guest-accessible behavior.

#### Scenario: Middleware enables auth without blocking
- **WHEN** any request reaches the application
- **THEN** the Clerk middleware processes auth headers and populates the auth context
- **AND** unauthenticated requests are NOT blocked or redirected
