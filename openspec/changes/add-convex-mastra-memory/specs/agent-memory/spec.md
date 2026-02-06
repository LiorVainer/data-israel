# agent-memory Specification

## ADDED Requirements

### Requirement: Instance-Level Convex Storage
The system SHALL configure `@convex-dev/mastra` ConvexStorage at the Mastra instance level, replacing the ephemeral per-agent LibSQLStore `:memory:` configuration. All agents SHALL inherit storage from the Mastra instance automatically.

#### Scenario: Persistent message storage
- **WHEN** a user sends a message and receives a response
- **THEN** both messages SHALL be persisted in Convex tables
- **AND** messages SHALL survive server restarts

#### Scenario: Thread continuity
- **WHEN** a user returns to an existing conversation thread
- **THEN** the agent SHALL have access to the full message history for that thread
- **AND** the agent SHALL respond with context from previous messages

#### Scenario: Convex component registration
- **WHEN** the Convex app is configured
- **THEN** the mastra component SHALL be registered alongside the existing RAG component
- **AND** both components SHALL operate independently

#### Scenario: Shared storage across agents
- **WHEN** multiple agents are registered in the Mastra instance
- **THEN** all agents SHALL share the same ConvexStorage backend
- **AND** individual agents SHALL configure only Memory options (lastMessages, semanticRecall) without specifying storage

### Requirement: Semantic Recall on Message History
The system SHALL use ConvexVector to enable semantic search over past messages, allowing the agent to recall relevant context from earlier in the conversation or from other threads.

#### Scenario: Relevant message retrieval
- **WHEN** the agent processes a new user message
- **THEN** the system SHALL perform vector search to find semantically similar past messages
- **AND** include top-K relevant messages as additional context

#### Scenario: Semantic recall configuration
- **WHEN** Memory is initialized
- **THEN** semanticRecall SHALL be configured with topK of 3 and messageRange of 2
- **AND** vector embeddings SHALL be generated for all stored messages

### Requirement: Thread-Based Chat Routing
The system SHALL route each conversation to a unique URL `/chat/:id` where `:id` is a UUID that doubles as the Mastra memory thread ID.

#### Scenario: New chat creation from home page
- **WHEN** a user submits the first message on the home page (`/`)
- **THEN** the system SHALL generate a UUID via `crypto.randomUUID()`
- **AND** navigate to `/chat/${uuid}` with the initial message
- **AND** the chat page SHALL auto-send the initial message on mount

#### Scenario: Chat page uses URL param as thread ID
- **WHEN** the chat page at `/chat/:id` loads
- **THEN** it SHALL extract the ID via `useParams()`
- **AND** pass it as `memory.thread` in `useChat`'s `DefaultChatTransport` `prepareSendMessagesRequest`

#### Scenario: Thread ID passed to Mastra via DefaultChatTransport
- **WHEN** `useChat` sends a request to `/api/chat`
- **THEN** the request body SHALL include `memory: { thread: chatId, resource: 'default-user' }`
- **AND** `handleChatStream` SHALL forward these params to the agent for persistent memory

#### Scenario: Direct navigation to existing thread
- **WHEN** a user navigates directly to `/chat/:id` for an existing thread
- **THEN** the system SHALL load previous messages from Convex storage
- **AND** the conversation SHALL continue from where it left off

### Requirement: Memory Configuration Defaults
The system SHALL configure agent memory with sensible defaults for context window and recall behavior.

#### Scenario: Last messages limit
- **WHEN** memory is configured
- **THEN** lastMessages SHALL be set to 20
- **AND** only the most recent 20 messages SHALL be included in the context window

#### Scenario: Auto-generated thread titles
- **WHEN** a new thread is created
- **THEN** the system SHALL automatically generate a title based on the conversation content
