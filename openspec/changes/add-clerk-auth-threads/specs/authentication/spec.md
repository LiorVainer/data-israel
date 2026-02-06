# Capability: Authentication

User authentication and session management using Clerk with support for guest sessions.

## ADDED Requirements

### Requirement: Clerk Authentication Provider

The system SHALL integrate Clerk as the authentication provider, wrapping the application with `ClerkProvider` and `ConvexProviderWithClerk` for secure Convex operations.

#### Scenario: Application initializes with auth providers
- **WHEN** the application loads
- **THEN** ClerkProvider wraps the entire component tree
- **AND** ConvexProviderWithClerk provides authenticated Convex client
- **AND** Clerk JWT is validated against Convex auth config

#### Scenario: Auth context available to components
- **WHEN** a component uses `useAuth()` or `useUser()` hooks
- **THEN** it receives the current authentication state
- **AND** `isSignedIn`, `user`, and session information are accessible

### Requirement: Sign-In Page

The system SHALL provide a sign-in page at `/sign-in/[[...sign-in]]` using Clerk Elements with Google One Tap for streamlined authentication.

#### Scenario: User signs in with Google One Tap
- **WHEN** user navigates to `/sign-in`
- **THEN** the `<GoogleOneTap />` component is rendered
- **AND** Google One Tap prompt appears automatically
- **AND** user can sign in with one click using their Google account
- **AND** upon successful authentication, user is redirected to home

#### Scenario: Google One Tap with custom redirect
- **WHEN** user completes Google One Tap authentication
- **THEN** user is redirected to the configured `signInForceRedirectUrl`
- **AND** Clerk session is established with Google identity

### Requirement: Sign-Up Page

The system SHALL provide a sign-up page at `/sign-up/[[...sign-up]]` using Clerk Elements with Google One Tap for streamlined registration.

#### Scenario: User signs up with Google One Tap
- **WHEN** user navigates to `/sign-up`
- **THEN** the `<GoogleOneTap />` component is rendered
- **AND** Google One Tap prompt appears automatically
- **AND** user can create account with one click using their Google account
- **AND** new account is created automatically with Google profile data
- **AND** user is signed in and redirected to home

#### Scenario: Google One Tap handles new vs existing users
- **WHEN** user completes Google One Tap flow
- **AND** Google account is not linked to existing Clerk user
- **THEN** a new user account is created
- **AND** user is redirected to `signUpForceRedirectUrl`

### Requirement: Guest Session Management

The system SHALL create and manage guest sessions for unauthenticated users, storing session ID in localStorage and guest records in Convex.

#### Scenario: Guest session created on first visit
- **WHEN** an unauthenticated user visits the application
- **AND** no guest session exists in localStorage
- **THEN** a new UUID-based session ID is generated
- **AND** session ID is stored in localStorage as `guest-session-id`
- **AND** a guest record is created in Convex `guests` table

#### Scenario: Guest session persists across visits
- **WHEN** a guest user returns to the application
- **AND** guest session exists in localStorage
- **THEN** the existing session ID is retrieved
- **AND** guest ID is loaded from localStorage
- **AND** no new guest record is created

#### Scenario: Guest session used for thread ownership
- **WHEN** a guest user creates a conversation thread
- **THEN** the thread's resourceId is set to the guest ID
- **AND** thread appears in guest's thread list

### Requirement: User Context Provider

The system SHALL provide a unified `UserContext` that abstracts authentication state for both authenticated users and guests.

#### Scenario: Authenticated user context
- **WHEN** a user is signed in via Clerk
- **THEN** `useUser()` returns `isAuthenticated: true`
- **AND** `userId` returns Clerk's `identity.subject`
- **AND** `guestId` is null

#### Scenario: Guest user context
- **WHEN** a user is not signed in
- **THEN** `useUser()` returns `isAuthenticated: false`
- **AND** `guestId` returns the Convex guest ID
- **AND** `userId` returns the guest ID for queries

#### Scenario: Loading state during initialization
- **WHEN** auth state is being determined
- **THEN** `useUser()` returns `isLoading: true`
- **AND** components can show loading UI

### Requirement: Convex Auth Configuration

The system SHALL configure Convex to validate Clerk JWTs using the auth config file with the Convex JWT template from Clerk Dashboard.

#### Scenario: JWT validation via Convex template
- **WHEN** Convex auth.config.ts is configured with Clerk's Frontend API URL
- **AND** Clerk Dashboard has a Convex JWT template created
- **THEN** Convex validates incoming JWTs against Clerk's issuer
- **AND** `ctx.auth.getUserIdentity()` returns user identity with subject, email, name

#### Scenario: Authenticated request in Convex function
- **WHEN** a Convex query/mutation is called by authenticated user
- **THEN** `ctx.auth.getUserIdentity()` returns identity object
- **AND** `identity.subject` contains Clerk user ID
- **AND** this can be used for thread ownership validation

#### Scenario: Unauthenticated request handling
- **WHEN** Convex receives a request without valid auth token
- **THEN** `ctx.auth.getUserIdentity()` returns null
- **AND** function can fallback to guestId for authorization

### Requirement: Auth State via Convex Hooks

The system SHALL use Convex auth hooks and components (not Clerk's) for checking authentication state in the frontend.

#### Scenario: Use useConvexAuth for auth state
- **WHEN** a component needs to check authentication status
- **THEN** it uses `useConvexAuth()` from `convex/react`
- **AND** `isAuthenticated` is true only after Convex validates the JWT
- **AND** this ensures backend has confirmed the user's identity

#### Scenario: Use Authenticated/Unauthenticated components
- **WHEN** rendering auth-conditional UI
- **THEN** `<Authenticated>` and `<Unauthenticated>` from `convex/react` are used
- **AND** content inside `<Authenticated>` only renders after JWT validation
- **AND** this prevents race conditions with Convex queries
