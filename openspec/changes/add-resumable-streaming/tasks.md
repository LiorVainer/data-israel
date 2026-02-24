## 1. Infrastructure Setup

- [x] 1.1 Install `resumable-stream` and `@upstash/redis` packages via pnpm
- [x] 1.2 Create `lib/redis/client.ts` - Upstash Redis singleton using `@upstash/redis` with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars. Export a `getRedisClient()` function that returns `null` if env vars are missing (graceful fallback)
- [x] 1.3 Create `lib/redis/resumable-stream.ts` - factory function that:
  - Creates `createResumableStreamContext` using Upstash Redis pub/sub adapters
  - Falls back to in-memory pub/sub if Redis is unavailable
  - Exports `getActiveStreamId(threadId)`, `setActiveStreamId(threadId, streamId)`, `clearActiveStreamId(threadId)` helpers using Redis GET/SET/DEL with key pattern `stream:active:{threadId}` and 10-minute TTL
- [x] 1.4 Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.example` (do NOT commit actual values)
- [x] 1.5 Run `tsc` and `npm run build` to verify no type errors

## 2. Server-Side Resumable Stream Integration

- [x] 2.1 Refactor `POST /api/chat/route.ts`: wrap `createUIMessageStreamResponse` to use `consumeSseStream` callback that persists the SSE stream via resumable stream context and saves `activeStreamId` to Redis (Upstash) with 10min TTL
- [x] 2.2 Ensure `onFinish` callback clears `activeStreamId` from Redis after stream completes
- [x] 2.3 Use `next/server` `after()` as `waitUntil` for the resumable stream context
- [x] 2.4 Create new route `app/api/chat/[id]/stream/route.ts` with GET handler that:
  - Reads `activeStreamId` from Redis for the given thread ID
  - Returns 204 if no active stream
  - Returns resumed stream with `UI_MESSAGE_STREAM_HEADERS` if active
- [x] 2.5 Ensure the `handleChatStream` + billing flow is unaffected (onStepFinish, onFinish, billing writes all still work)
- [x] 2.6 Run `tsc`, `npm run build`, and `npm run lint` to verify

## 3. Client-Side Resume Integration

- [x] 3.1 Update `ChatThread.tsx`: add `resume: true` to `useChat` configuration
- [x] 3.2 Configure `DefaultChatTransport` (or custom transport) with `prepareSendMessagesRequest` to include chat ID in request body
- [x] 3.3 Verify `useChat` reconnection behavior: on page reload or connection drop, client automatically calls `GET /api/chat/[id]/stream` to resume
- [x] 3.4 Add reconnection UX indicator (optional: subtle loading state while reconnecting)
- [x] 3.5 Run `tsc`, `npm run build`, and `npm run lint`

## 4. Graceful Fallback & Error Handling

- [x] 4.1 Add try/catch around Upstash Redis initialization - if unavailable, fall back to in-memory pub/sub; if that also fails, fall back to non-resumable streaming (current behavior)
- [x] 4.2 Handle GET stream route errors gracefully (return 204 if Redis lookup fails)
- [x] 4.3 Ensure `onFinish` always fires even if resumable stream persistence fails
- [x] 4.4 Add console warnings when falling back to in-memory or non-resumable mode

## 5. Testing & Verification

- [ ] 5.1 Manual test: send message, observe stream completes normally (happy path)
- [ ] 5.2 Manual test: send message, close tab mid-stream, reopen - verify stream resumes
- [ ] 5.3 Manual test: send message, refresh page mid-stream - verify stream resumes
- [ ] 5.4 Manual test: verify billing records are persisted after tab close mid-stream
- [ ] 5.5 Manual test: verify sub-agent tool calls display correctly after reconnect
- [ ] 5.6 Manual test: verify `onFinish` fires and memory is saved after reconnect
- [ ] 5.7 Run full verification: `npm run build && npm run lint && npm run vibecheck`

## 6. Production Hardening (Post-MVP)

- [ ] 6.1 Verify Upstash Redis connection resilience (auto-reconnect, request timeouts)
- [ ] 6.2 Confirm stream TTL of 10 minutes works correctly (streams expire, keys expire)
- [ ] 6.3 Add observability: log stream creation, reconnection, and completion events
- [ ] 6.4 Document environment variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
