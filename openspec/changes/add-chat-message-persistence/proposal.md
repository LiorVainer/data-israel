# Change: Add chat message persistence (load history on page load)

## Why
Currently, when a user refreshes the chat page or navigates back to an existing thread URL (`/chat/:id`), all previous messages are lost because `useChat` starts with an empty message array. The Mastra agent already persists messages to Convex via `ConvexStore`, but the frontend never retrieves them on mount.

## What Changes
- Add a `GET` handler to `app/api/chat/route.ts` that uses Mastra's `memory.recall()` to fetch messages for a given thread
- Convert stored messages to AI SDK UI format using `toAISdkV5Messages` from `@mastra/ai-sdk/ui`
- Split `app/chat/[id]/page.tsx` into a server component (data fetcher) and a client component (chat UI)
- Pass fetched messages as `initialMessages` to the client component, which feeds them into `useChat` via the `messages` parameter

## Impact
- Affected specs: none (new capability)
- Affected code:
  - `app/api/chat/route.ts` — add GET handler
  - `app/chat/[id]/page.tsx` — split into server + client components
  - New file: `components/chat/ChatThread.tsx` (extracted client component)
