## Context

The current chat streaming architecture ties agent execution to a single HTTP request. If the client disconnects, the entire agent run (including billing, memory, and tool execution) is interrupted. The Vercel AI SDK v6 provides a first-class solution via the `resumable-stream` package that persists SSE streams server-side and allows clients to reconnect mid-stream.

### Stakeholders
- End users (stream interruption = lost responses)
- Billing system (incomplete `onFinish` = lost revenue tracking)
- Memory system (incomplete execution = inconsistent thread state)

### Constraints
- Must remain compatible with Mastra `handleChatStream` + `createUIMessageStreamResponse`
- Must not break existing `useChat` UIMessage format
- Must work with existing Convex memory/billing infrastructure
- Must support sub-agent delegation (routing agent -> datagovAgent/cbsAgent)
- Hebrew RTL UI must not be affected

## Goals / Non-Goals

### Goals
- Agent execution continues independently of client HTTP connection
- Client can reconnect and resume receiving tokens mid-message
- Billing (`onFinish`) always completes
- Memory persistence always completes
- Tool calls complete regardless of client state
- Graceful degradation if resumable infra is unavailable

### Non-Goals
- Server-side orchestration changes (Mastra workflow wrapping) - kept as-is
- Multi-region or distributed stream persistence
- Stream replay from beginning (only resume from current position)
- Offline queue or delayed message delivery
- Changing the agent network architecture

## Decisions

### Decision 1: Use `resumable-stream` package (Vercel's official solution)

**What**: Add the `resumable-stream` npm package which provides `createResumableStreamContext` for server-side SSE stream persistence with pub/sub.

**Why**: This is the canonical Vercel solution, purpose-built for AI SDK. It integrates directly with `toUIMessageStreamResponse`'s `consumeSseStream` callback. Zero custom stream management code needed.

**Alternatives considered**:
- **Workflow DevKit (useworkflow.dev)**: Full durable workflow framework with `"use workflow"` / `"use step"` directives. Overkill for our use case - we don't need workflow orchestration, just stream persistence. Would require wrapping all Mastra agents in workflow steps, adding significant complexity.
- **Custom SSE buffer**: Build our own stream persistence in Convex. High effort, no reconnection protocol, would need to reimplement what `resumable-stream` already provides.
- **Mastra workflow streaming**: Mastra has `createRun().stream()` with `resumeStream()` but this is for Mastra-native workflows, not for the `handleChatStream` pattern we use. Would require rewriting the entire agent execution flow.

### Decision 2: Upstash Redis for all environments

**What**: Use `@upstash/redis` as the Redis client for `resumable-stream` in both production and development environments.

**Why**: Upstash is serverless, HTTP-based (no TCP connection management), has a generous free tier for development, and works seamlessly in serverless environments like Vercel. No connection pooling or keep-alive management needed.

**Configuration**: Environment-driven via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. If missing, fall back to in-memory pub/sub with a console warning.

**File structure**:
```
lib/redis/
  client.ts              # Upstash Redis singleton (HTTP-based)
  resumable-stream.ts    # createResumableStreamContext factory + activeStreamId helpers
```

### Decision 3: Track `activeStreamId` in Redis (not Convex)

**What**: Store the `activeStreamId` for each thread in the same Upstash Redis instance used by `resumable-stream`.

**Why**: The GET reconnection endpoint needs sub-millisecond lookup for `activeStreamId`. Redis is already required for stream persistence, so co-locating `activeStreamId` there avoids an extra Convex round-trip and keeps all streaming state in one place. Uses a simple key pattern: `stream:active:{threadId}` -> `streamId`, with the same 10-minute TTL as the streams themselves.

**Alternative considered**: Convex. Rejected because Convex queries have higher latency than Redis GET, and the reconnection endpoint is latency-sensitive.

### Decision 4: New route `GET /api/chat/[id]/stream` for reconnection

**What**: Add a dynamic route segment `[id]` under the chat API for stream reconnection.

**Why**: The AI SDK's `useChat({ resume: true })` expects a GET endpoint at `{api}/{chatId}/stream` to reconnect. This follows the convention from the official docs.

### Decision 5: Use `next/server`'s `after()` for background stream persistence

**What**: Use Next.js `after()` function as the `waitUntil` parameter for `createResumableStreamContext`.

**Why**: `after()` ensures the stream persistence callback continues running even after the response is sent to the client. This is the exact pattern used in Vercel's official example.

## Data Flow

```
Client (useChat, resume: true)
  |
  |-- POST /api/chat (new message)
  |     |
  |     v
  |   handleChatStream(mastra, 'routingAgent', params)
  |     |
  |     v
  |   createUIMessageStreamResponse({
  |     stream,
  |     consumeSseStream: async ({ stream }) => {
  |       const streamId = generateId();
  |       const ctx = createResumableStreamContext({ waitUntil: after });
  |       await ctx.createNewResumableStream(streamId, () => stream);
  |       saveActiveStreamId(threadId, streamId);  // Redis (Upstash), TTL 10min
  |     },
  |     onFinish: ({ messages }) => {
  |       clearActiveStreamId(threadId);  // Redis (Upstash)
  |       persistBilling(...);            // Already implemented
  |     }
  |   })
  |
  |-- [connection drops mid-stream]
  |
  |-- GET /api/chat/{threadId}/stream (auto-reconnect)
        |
        v
      readActiveStreamId(threadId)  // Redis (Upstash)
        |
        v
      ctx.resumeExistingStream(activeStreamId)
        |
        v
      Return stream with UI_MESSAGE_STREAM_HEADERS
        |
        v
      Client continues receiving tokens from where it left off
```

## Risks / Trade-offs

### Risk 1: Upstash Redis dependency
- **Impact**: Adds an external service dependency (Upstash)
- **Mitigation**: Graceful fallback to in-memory pub/sub (then to non-resumable mode) if Upstash env vars are missing or connection fails. Upstash has 99.99% SLA and free tier for dev.

### Risk 2: Abort signal conflicts with resume
- **Impact**: The AI SDK docs warn that `resume: true` can conflict with abort/stop functionality (closing tab triggers abort which may interfere with resumption)
- **Mitigation**: Follow the documented pattern from `ai-sdk.dev/docs/troubleshooting/abort-breaks-resumable-streams`. Separate the user's abort intent from connection-drop behavior.

### Risk 3: Sub-agent streaming artifacts
- **Impact**: `data-tool-agent` parts are streaming-only artifacts. After reconnect, these may need reconstruction.
- **Mitigation**: The existing `enrichWithSubAgentData()` two-pass recall already handles this for page reloads. The resumable stream delivers the same chunks, so no additional handling needed for mid-stream reconnects.

### Risk 4: `after()` not available in all deployment targets
- **Impact**: `after()` from `next/server` requires Next.js 15+ on supported platforms.
- **Mitigation**: We're on Next.js 16.1.1 which supports it. For non-Vercel deployments, `after()` works with Node.js runtime.

## Migration Plan

### Phase 1: Infrastructure (no user-facing changes)
1. Install `resumable-stream` and `@upstash/redis` packages
2. Create `lib/redis/client.ts` - Upstash Redis singleton (env-driven)
3. Create `lib/redis/resumable-stream.ts` - factory for `createResumableStreamContext` with Upstash pub/sub + `activeStreamId` helpers (get/set/clear with 10min TTL)

### Phase 2: Server-side integration
5. Refactor `POST /api/chat` to use `consumeSseStream` callback
6. Create `GET /api/chat/[id]/stream` reconnection route
7. Ensure `onFinish` clears active stream

### Phase 3: Client-side integration
8. Update `ChatThread.tsx` to use `resume: true` in `useChat`
9. Configure transport with `prepareSendMessagesRequest`
10. Handle reconnection UX (loading indicator during reconnect)

### Phase 4: Hardening
11. Add error handling for Upstash connection failures
12. Add graceful fallback to non-resumable mode (in-memory -> no-resume)
13. Test connection drop scenarios
14. Verify billing idempotency under reconnect

### Rollback
- Remove `resume: true` from client (instant rollback, no server changes needed)
- Server changes are backward-compatible (consumeSseStream is additive)

## Resolved Questions

1. **Redis hosting**: **Upstash** - serverless, HTTP-based, free tier for dev, no connection pooling needed.
2. **Stream TTL**: **10 minutes** - streams and `activeStreamId` keys auto-expire after 10 minutes.
3. **Cancellation UX**: **No server-side cancellation** - out of scope. Client-side stop via abort signal is sufficient.
4. **activeStreamId storage**: **Redis (Upstash)** - co-located with stream data for minimal latency on reconnection lookups. Key pattern: `stream:active:{threadId}` with 10min TTL.
