# Tasks: Add Convex Memory for Mastra Agents + Thread-Based Chat Routing

## 1. Investigation
- [x] 1.1 Verify `@mastra/convex` compatibility with Next.js API routes (uses HTTP client, no setCtx needed)
- [x] 1.2 Verify `handleChatStream` accepts `memory: { thread, resource }` params from request body
- [x] 1.3 Confirmed `@convex-dev/mastra` is incompatible (alpha, wrong Mastra version) — switched to `@mastra/convex@1.0.1`

## 2. Dependencies & Configuration
- [x] 2.1 Install `@mastra/convex@1.0.1` package
- [x] 2.2 Add Mastra tables to `convex/schema.ts` (threads, messages, resources, etc.)
- [x] 2.3 Create `convex/mastra/storage.ts` handler
- [x] 2.4 Add `CONVEX_ADMIN_KEY` placeholder to `.env.local`
- [x] 2.5 Add `@mastra/convex` to `next.config.ts` serverExternalPackages
- [x] 2.6 Remove `@mastra/libsql` dependency (no longer used)

## 3. Mastra Instance-Level Storage
- [x] 3.1 Update `agents/mastra.ts` with `ConvexStore` as instance-level storage (graceful fallback if env vars missing)
- [x] 3.2 Simplify routing agent to use `new Memory()` with `ConvexVector` and options only
- [x] 3.3 Simplify DataGov agent to use `new Memory()` with options only
- [x] 3.4 Simplify CBS agent to use `new Memory()` with options only
- [x] 3.5 API route (`app/api/chat/route.ts`) passes params through — no changes needed (handleChatStream spreads memory into agent options)

## 4. Thread-Based Chat Routing (Frontend)
- [x] 4.1 Create `app/chat/[id]/page.tsx` dynamic route with chat UI
- [x] 4.2 Use `useParams()` to extract chat ID from URL
- [x] 4.3 Configure `useChat` with `DefaultChatTransport` and `prepareSendMessagesRequest` to pass `memory: { thread: chatId, resource: 'default-user' }` in body
- [x] 4.4 Move chat rendering logic from `app/page.tsx` to `app/chat/[id]/page.tsx`

## 5. New Chat Flow (Home -> /chat/:id)
- [x] 5.1 Update `app/page.tsx` to act as landing/new-chat page
- [x] 5.2 On first message submit: generate UUID via `crypto.randomUUID()`, navigate to `/chat/${uuid}?q=...`
- [x] 5.3 Pass initial message via URL search param `?q=`
- [x] 5.4 In `app/chat/[id]/page.tsx`: detect initial message on mount and auto-send

## 6. Dev Experience
- [x] 6.1 Replace `@mastra/libsql` with `@mastra/convex` in `next.config.ts` serverExternalPackages

## 7. Verification
- [x] 7.1 tsc --noEmit passes with zero errors
- [x] 7.2 npm run build succeeds (routes: / static, /chat/[id] dynamic, /api/chat dynamic)
- [x] 7.3 vibecheck score: 77/100 (no regressions from changes)
- [ ] 7.4 Manual test: set CONVEX_ADMIN_KEY, run Convex dev, verify thread persistence
- [ ] 7.5 Manual test: submit on / -> redirects to /chat/:id -> message streams
