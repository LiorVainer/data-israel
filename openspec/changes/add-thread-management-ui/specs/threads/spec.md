## MODIFIED Requirements

### Requirement: Thread Operations via MastraClient

The system SHALL use direct Convex mutations for thread rename and delete operations, with authorization checks.

#### Scenario: Rename thread via Convex mutation
- **WHEN** user renames a thread
- **THEN** `renameThread` Convex mutation is called with `threadId`, `newTitle`, and optional `guestId`
- **AND** mutation authenticates via `ctx.auth.getUserIdentity()` or `guestId`
- **AND** mutation verifies thread's `resourceId` matches the caller
- **AND** mutation patches thread with new title and updated timestamp
- **AND** Convex query automatically reflects the change (real-time)

#### Scenario: Delete thread via Convex mutation
- **WHEN** user deletes a thread
- **THEN** `deleteThread` Convex mutation is called with `threadId` and optional `guestId`
- **AND** mutation authenticates via `ctx.auth.getUserIdentity()` or `guestId`
- **AND** mutation verifies thread's `resourceId` matches the caller
- **AND** mutation deletes all messages in `mastra_messages` with matching `thread_id`
- **AND** mutation deletes the thread document from `mastra_threads`
- **AND** sidebar list updates automatically

#### Scenario: Unauthorized thread operation rejected
- **WHEN** a thread operation is attempted by a user who does not own the thread
- **THEN** the mutation throws an error
- **AND** no data is modified
