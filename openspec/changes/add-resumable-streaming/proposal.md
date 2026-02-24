# Change: Add Resumable Streaming for Durable Agent Execution

## Why

Streaming is currently tied to a single HTTP request lifecycle. If the user closes the tab, refreshes mid-response, or loses connection, then:

- Agent execution stops
- `onFinish` may never run
- Billing may not persist
- Context snapshot may be incorrect
- Partial token output is lost
- Tool calls may remain unfinished

This breaks the reliability of billing, memory persistence, and user experience.

## What Changes

- Add `resumable-stream` package for server-side stream persistence (Redis pub/sub or in-memory for dev)
- Modify `POST /api/chat` to use `consumeSseStream` callback with `createResumableStreamContext` so the SSE stream is persisted server-side
- Add `GET /api/chat/[id]/stream` route to allow clients to reconnect to an active stream by chat ID
- Track `activeStreamId` per thread in Redis (Upstash)
- Modify frontend `useChat` to enable `resume: true` for automatic stream resumption on reconnect
- Wrap existing `handleChatStream` + `createUIMessageStreamResponse` flow to support the resumable pattern
- Ensure `onFinish` and billing callbacks always complete regardless of client state
- Add graceful fallback: if `resumable-stream` infra is unavailable, fall back to current non-resumable behavior

## Impact

- Affected specs: `agent-tools` (streaming behavior change)
- New spec: `resumable-streaming` (new capability)
- Affected code:
  - `app/api/chat/route.ts` (POST handler refactored to use consumeSseStream)
  - New: `app/api/chat/[id]/stream/route.ts` (GET handler for stream reconnection)
  - `components/chat/ChatThread.tsx` (useChat resume option + transport config)
  - New: `lib/redis/client.ts` (Upstash Redis client singleton)
  - New: `lib/redis/resumable-stream.ts` (resumable stream context factory using Upstash)
  - `package.json` (add `resumable-stream`, `@upstash/redis`)

## Research Summary

### Approach: Vercel AI SDK Native Resumable Streams

The AI SDK v6 has first-class support for resumable streams via the `resumable-stream` package. This is the **canonical Vercel-recommended** approach used in their official examples.

### Architecture Pattern (from Vercel AI SDK docs + examples)

**Server (POST /api/chat):**
```
streamText() / handleChatStream()
  -> .toUIMessageStreamResponse({ consumeSseStream })
     -> createResumableStreamContext({ waitUntil: after })
     -> streamContext.createNewResumableStream(streamId, () => stream)
     -> Save activeStreamId to persistence
```

**Server (GET /api/chat/[id]/stream):**
```
Read activeStreamId from persistence
  -> If null -> 204 No Content
  -> streamContext.resumeExistingStream(activeStreamId)
  -> Return stream with UI_MESSAGE_STREAM_HEADERS
```

**Client:**
```
useChat({
  resume: true,
  transport: new DefaultChatTransport({
    prepareSendMessagesRequest: ({ id, messages }) => ({
      body: { id, message: messages[messages.length - 1] }
    })
  })
})
```

### Persistence Options

| Option | Pros | Cons | Use Case |
|--------|------|------|----------|
| Upstash Redis | Serverless, HTTP-based, no connection pooling needed | External dependency | Production + Dev |
| ioredis | Standard Redis client, wide ecosystem | TCP connections, connection pooling | Self-hosted Redis |
| In-memory pub/sub | Zero dependencies, instant | Single-process, lost on restart | Fallback only |

**Decision**: Use `resumable-stream` with **Upstash Redis** for both production and development (Upstash free tier is sufficient for dev). Track `activeStreamId` in Redis alongside stream data (same Upstash instance, zero extra latency). Stream TTL: **10 minutes**. In-memory pub/sub as fallback only when Upstash env vars are missing.

### Key References

- **Official AI SDK docs**: `ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams`
- **Official example**: `vercel/ai/examples/next/app/api/chat/route.ts`
- **VoltAgent in-memory pattern**: `VoltAgent/voltagent/packages/resumable-streams/`
- **Real implementation**: `AIMOverse/aimo-bet/lib/ai/workflows/workflowTransport.ts`
- **Troubleshooting**: `ai-sdk.dev/docs/troubleshooting/abort-breaks-resumable-streams`

### Integration with Mastra

The current `handleChatStream` returns a stream that feeds into `createUIMessageStreamResponse`. The resumable pattern wraps this via `consumeSseStream` callback on `createUIMessageStreamResponse` - **no changes to Mastra itself are needed**. The stream from `handleChatStream` continues to be the data source; we just persist it server-side so clients can reconnect.

### Billing Safety

With resumable streams, `onFinish` is guaranteed to fire because the agent execution is decoupled from the HTTP connection. The `consumeSseStream` callback runs after the stream is created, and `onFinish` fires when the stream completes - both independent of client connection state. Combined with idempotent billing writes using `threadId` as the dedup key (already implemented), billing is safe.
