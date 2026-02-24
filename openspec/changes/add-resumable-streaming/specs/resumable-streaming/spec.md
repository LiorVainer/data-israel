## ADDED Requirements

### Requirement: Resumable Stream Persistence

The system SHALL persist SSE stream data server-side using the `resumable-stream` package so that agent execution and streaming continue independently of the client HTTP connection.

#### Scenario: Stream persisted on new message
- **WHEN** a user sends a message via `POST /api/chat`
- **THEN** the system SHALL create a resumable stream context using `createResumableStreamContext`
- **AND** persist the SSE stream via `consumeSseStream` callback
- **AND** store the `activeStreamId` for the thread in Redis (Upstash) with a 10-minute TTL

#### Scenario: Stream cleared on completion
- **WHEN** the agent finishes execution and `onFinish` fires
- **THEN** the system SHALL clear the `activeStreamId` from Redis
- **AND** billing and memory persistence SHALL have completed

#### Scenario: Agent execution survives client disconnect
- **WHEN** the client closes the tab or loses connection mid-stream
- **THEN** the agent execution SHALL continue on the server
- **AND** `onFinish` SHALL fire with complete billing data
- **AND** memory SHALL be persisted to Convex

### Requirement: Stream Reconnection Endpoint

The system SHALL provide a `GET /api/chat/[id]/stream` endpoint that allows clients to reconnect to an active stream by thread ID.

#### Scenario: Reconnect to active stream
- **WHEN** a client sends `GET /api/chat/{threadId}/stream`
- **AND** an active stream exists for that thread
- **THEN** the system SHALL return the resumed stream with `UI_MESSAGE_STREAM_HEADERS`
- **AND** the client SHALL receive remaining tokens from the current position

#### Scenario: No active stream
- **WHEN** a client sends `GET /api/chat/{threadId}/stream`
- **AND** no active stream exists for that thread
- **THEN** the system SHALL return HTTP 204 (No Content)

### Requirement: Client Resume Integration

The frontend `useChat` hook SHALL be configured with `resume: true` to enable automatic stream resumption on reconnect.

#### Scenario: Automatic reconnection on page reload
- **WHEN** the user refreshes the page while a stream is active
- **THEN** the `useChat` hook SHALL automatically call the stream reconnection endpoint
- **AND** resume displaying tokens from where the stream left off
- **AND** the UI SHALL remain compatible with the existing `UIMessage` format

#### Scenario: Automatic reconnection on connection drop
- **WHEN** the network connection drops and recovers
- **THEN** the `useChat` hook SHALL automatically reconnect to the active stream
- **AND** continue displaying the agent response without message duplication

### Requirement: Upstash Redis Stream Infrastructure

The system SHALL use Upstash Redis (HTTP-based) for stream persistence and `activeStreamId` tracking, with automatic fallback.

#### Scenario: Upstash Redis backend
- **WHEN** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables are set
- **THEN** the system SHALL use Upstash Redis pub/sub for stream persistence
- **AND** store `activeStreamId` in Redis with key pattern `stream:active:{threadId}`
- **AND** all stream-related keys SHALL have a 10-minute TTL

#### Scenario: In-memory fallback when Upstash is not configured
- **WHEN** Upstash environment variables are missing
- **THEN** the system SHALL fall back to in-memory pub/sub for stream persistence
- **AND** log a warning about in-memory mode
- **AND** streams SHALL be available for reconnection within the same process

#### Scenario: Graceful fallback on infrastructure failure
- **WHEN** the resumable stream infrastructure is unavailable (Upstash down, initialization error)
- **THEN** the system SHALL fall back to non-resumable streaming (current behavior)
- **AND** log a warning about degraded mode
- **AND** agent execution, billing, and memory SHALL still function correctly

### Requirement: Idempotent Billing Under Reconnection

The billing system SHALL persist usage data exactly once per agent turn, regardless of client reconnection behavior.

#### Scenario: Billing persists after client disconnect
- **WHEN** the client disconnects mid-stream
- **AND** the agent continues execution server-side
- **THEN** `onFinish` SHALL fire and persist billing data to Convex
- **AND** the billing record SHALL use `threadId` as idempotency key

#### Scenario: No duplicate billing on reconnect
- **WHEN** a client reconnects to an active stream
- **THEN** no additional billing records SHALL be created
- **AND** the original `onFinish` billing write SHALL be the only record
