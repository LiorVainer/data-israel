## MODIFIED Requirements

### Requirement: Resumable Stream Persistence

The system SHALL persist messages incrementally after each completed streaming step using `savePerStep: true`, so that user messages and intermediate results survive client disconnects (page refresh, tab close).

#### Scenario: Agent execution survives client disconnect
- **WHEN** the client closes the tab or refreshes the page mid-stream
- **THEN** the agent execution SHALL continue on the server
- **AND** `onFinish` SHALL fire with complete billing data
- **AND** memory SHALL be persisted to Convex

#### Scenario: Incremental message persistence via savePerStep
- **WHEN** a streaming agent completes a step (tool call round or text generation)
- **THEN** all unsaved messages (including the user message on the first step) SHALL be persisted to Convex immediately
- **AND** this SHALL happen regardless of whether the client is still connected
- **AND** subsequent page loads SHALL recall the persisted messages

#### Scenario: Messages survive mid-stream page refresh
- **WHEN** the user refreshes the page while the agent is streaming after at least one completed step
- **THEN** the user message and all completed step results SHALL already be persisted in Convex
- **AND** the resumed stream from Redis SHALL deliver remaining SSE events
- **AND** `GET /api/chat?threadId=...` SHALL return the persisted messages including the user message
