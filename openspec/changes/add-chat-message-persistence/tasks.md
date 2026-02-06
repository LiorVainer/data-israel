## 1. API: GET handler for message retrieval
- [x] 1.1 Add `GET` handler to `app/api/chat/route.ts` that accepts `threadId` and `resourceId` query params
- [x] 1.2 Use `mastra.getAgentById('routingAgent').getMemory()` to access agent memory
- [x] 1.3 Call `memory.recall({ threadId, resourceId })` to fetch stored messages
- [x] 1.4 Convert messages to UI format using `toAISdkV5Messages` from `@mastra/ai-sdk/ui`
- [x] 1.5 Return JSON response (empty array if no messages or thread not found)

## 2. Frontend: Split page into server + client components
- [x] 2.1 Extract chat UI from `app/chat/[id]/page.tsx` into `components/chat/ChatThread.tsx` client component
- [x] 2.2 Accept `id: string` and `initialMessages: UIMessage[]` as props on `ChatThread`
- [x] 2.3 Pass `initialMessages` to `useChat` via the `messages` parameter (AI SDK v6 API)
- [x] 2.4 Convert `app/chat/[id]/page.tsx` to a server component that fetches messages and renders `ChatThread`

## 3. Integration and edge cases
- [x] 3.1 Handle new threads (no stored messages) — pass empty array
- [x] 3.2 Handle Convex unavailability — graceful fallback to empty messages
- [x] 3.3 Preserve `?q=` initial message behavior (only auto-send if no existing messages, or always)
- [x] 3.4 Remove `console.log({ messages, status })` debug line from chat page

## 4. Verification
- [x] 4.1 Run `tsc` — no TypeScript errors
- [x] 4.2 Run `npm run build` — build succeeds
- [x] 4.3 Run `npm run lint` — no lint errors
- [ ] 4.4 Run `npm run vibecheck` — passes quality checks
- [ ] 4.5 Manual test: send messages, refresh page, verify messages persist
