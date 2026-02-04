# Capability: Threads

Conversation thread management using Mastra's built-in Memory APIs with Convex for real-time reactivity.

## Architecture Note

Mastra provides complete thread CRUD via `@mastra/memory`:
- `memory.createThread()`, `memory.listThreads()`, `memory.getThreadById()`
- `thread.update()`, `thread.delete()` via MastraClient

Convex is used ONLY for:
1. **Real-time UI updates** - `useQuery` on `mastra_threads` table
2. **Authorization** - Validating resourceId matches user/guest
3. **Guest management** - `guests` table (not part of Mastra)

## ADDED Requirements

### Requirement: Create Thread via Mastra Memory

The system SHALL create threads using Mastra's `memory.createThread()` API.

#### Scenario: Create thread with user identity
- **WHEN** a user (authenticated or guest) initiates a new conversation
- **THEN** `memory.createThread({ resourceId, metadata })` is called
- **AND** resourceId is set to Clerk subject or guestId
- **AND** thread is stored in `mastra_threads` table via ConvexStore
- **AND** thread ID is returned to client

#### Scenario: Thread creation rejected without identity
- **WHEN** thread creation is attempted without authentication or guestId
- **THEN** API returns 401 Unauthorized error

### Requirement: List Threads with Real-Time Updates

The system SHALL provide thread listing with real-time reactivity via Convex queries.

#### Scenario: Real-time thread list via Convex
- **WHEN** user views their thread list in sidebar
- **THEN** Convex `useQuery(api.threads.listUserThreads)` is used
- **AND** query reads directly from `mastra_threads` table
- **AND** list updates automatically when threads change (real-time)

#### Scenario: Thread list filtered by resourceId
- **WHEN** threads are queried
- **THEN** only threads where `resourceId` matches user's identity are returned
- **AND** threads are sorted by creation time descending

### Requirement: Thread Operations via MastraClient

The system SHALL use MastraClient for thread mutations (update, delete).

#### Scenario: Rename thread via MastraClient
- **WHEN** user renames a thread
- **THEN** `client.getMemoryThread({ threadId }).update({ title })` is called
- **AND** Mastra updates `mastra_threads` table
- **AND** Convex query automatically reflects the change (real-time)

#### Scenario: Delete thread via MastraClient
- **WHEN** user deletes a thread
- **THEN** `client.getMemoryThread({ threadId }).delete()` is called
- **AND** thread and messages are removed from Convex
- **AND** sidebar list updates automatically

### Requirement: Thread Authorization

The system SHALL validate thread ownership before allowing operations.

#### Scenario: Authorize via resourceId check
- **WHEN** a thread operation is requested
- **THEN** thread's `resourceId` is compared to current user's identity
- **AND** operation proceeds only if they match
- **AND** 403 Forbidden is returned for unauthorized access

### Requirement: Message Recall via Mastra Memory

The system SHALL use Mastra's `memory.recall()` for loading conversation history.

#### Scenario: Load thread messages on page load
- **WHEN** user navigates to `/chat/[threadId]`
- **THEN** `memory.recall({ threadId, resourceId })` is called server-side
- **AND** messages are converted via `toAISdkV5Messages()`
- **AND** chat UI is hydrated with conversation history

#### Scenario: New messages via chat streaming
- **WHEN** user sends a message
- **THEN** `handleChatStream` with `memory: { thread, resource }` handles persistence
- **AND** Mastra automatically saves messages to `mastra_messages` table

### Requirement: Auto-Generate Thread Title

The system SHALL automatically generate thread titles from conversation content after the first AI response.

#### Scenario: Title generated after first response
- **WHEN** a new thread receives its first AI response
- **THEN** agent generates title via `generateObject()` with schema
- **AND** `thread.update({ title, metadata: { summary } })` is called
- **AND** sidebar displays generated title
