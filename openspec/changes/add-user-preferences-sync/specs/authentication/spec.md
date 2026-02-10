## ADDED Requirements

### Requirement: Clerk Webhook User Sync
The system SHALL sync Clerk user data to a Convex `users` table via a Convex HTTP action endpoint at `/clerk-users-webhook` (defined in `convex/http.ts`).

#### Scenario: User created in Clerk
- **WHEN** a `user.created` event is received from Clerk
- **THEN** the system SHALL create a new record in the Convex `users` table with clerkId, email, firstName, lastName, and imageUrl
- **AND** the system SHALL set `createdAt` and `updatedAt` timestamps

#### Scenario: User updated in Clerk
- **WHEN** a `user.updated` event is received from Clerk
- **THEN** the system SHALL update the corresponding Convex `users` record with the new email, firstName, lastName, and imageUrl
- **AND** the system SHALL preserve the existing `themePreference` value
- **AND** the system SHALL update the `updatedAt` timestamp

#### Scenario: User deleted in Clerk
- **WHEN** a `user.deleted` event is received from Clerk
- **THEN** the system SHALL delete the corresponding record from the Convex `users` table

#### Scenario: Invalid webhook signature
- **WHEN** a request is received at the Convex webhook endpoint with an invalid signature
- **THEN** the system SHALL reject the request with a 400 status code
