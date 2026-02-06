## ADDED Requirements

### Requirement: Chat Message Persistence on Page Load
The system SHALL retrieve previously stored chat messages from Mastra memory when a user loads an existing chat thread, and display them in the conversation UI before any new interaction.

#### Scenario: User refreshes an existing chat thread
- **WHEN** a user navigates to `/chat/:id` where the thread has prior messages stored in Convex
- **THEN** the system fetches messages via Mastra `memory.recall()` and displays them in the conversation

#### Scenario: User opens a new thread with no history
- **WHEN** a user navigates to `/chat/:id` where no messages exist for the thread
- **THEN** the system renders an empty conversation and allows normal message input

#### Scenario: Convex storage is unavailable
- **WHEN** the Convex environment variables are missing or the storage service is unreachable
- **THEN** the system gracefully falls back to an empty conversation without errors

### Requirement: GET Endpoint for Thread Messages
The system SHALL expose a `GET /api/chat` endpoint that accepts `threadId` and `resourceId` query parameters and returns stored messages in AI SDK UI message format.

#### Scenario: Valid thread with messages
- **WHEN** a GET request is made with a valid `threadId` that has stored messages
- **THEN** the endpoint returns a JSON array of UI-formatted messages

#### Scenario: Thread with no messages
- **WHEN** a GET request is made with a `threadId` that has no stored messages
- **THEN** the endpoint returns an empty JSON array `[]`
