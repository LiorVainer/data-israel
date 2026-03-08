# fix-stream-resume-integrity

## Summary

Fix two integrity issues with stream resumability after page refresh:

1. **User message not saved**: Mastra saves all messages (user + assistant) only in `onFinish`, which is gated by `!abortSignal.aborted`. Page refresh aborts the request, so neither the user message nor the assistant response is persisted to Convex — even though the resumable stream continues from Redis.

2. **suggestFollowUps stuck in loading state**: After a resumed stream completes, the `suggestFollowUps` tool part may remain in `input-available` state (tool call sent but result never received). The UI treats this as "still loading" and shows a skeleton forever.

## Motivation

When a user refreshes mid-stream:
- The resumed stream delivers the assistant response (from Redis)
- But `GET /api/chat?threadId=...` returns messages WITHOUT the current turn (user + assistant) because `onFinish` was aborted
- The `suggestFollowUps` tool shows a permanent loading skeleton because its state never transitions to `output-available`

This breaks the conversation history and leaves the UI in a broken state.

## Scope

- `app/api/chat/route.ts` — enable `savePerStep` in handleChatStream options
- `components/chat/ChatThread.tsx` — handle incomplete `suggestFollowUps` state after stream ends

## Approach

### Issue 1: Enable `savePerStep: true`

Mastra supports incremental message saving via `savePerStep: true` (default: `false`). When enabled, messages are saved after each completed step via `saveStepMessages()`, which drains unsaved messages from the `MessageList` — including the user message on the first step.

This means even if the final `onFinish` is skipped due to abort, all completed steps (and the user message) are already persisted.

**Trade-off**: Slightly more Convex writes per turn (one per step instead of one at the end). Given that most turns have 2-4 steps, this is acceptable for the reliability guarantee.

### Issue 2: Extract suggestions from `input-available` state

The `suggestFollowUps` tool is a passthrough: `execute: (input) => ({ suggestions: input.suggestions })`. The suggestions are already available in the tool's `input` — we don't need to wait for `output-available`. The fix treats `input-available` the same as `output-available` for this specific tool.

## Related Changes

- `add-resumable-streaming` — original resumable stream infrastructure (gap: no `savePerStep`)
- `add-suggestions-and-source-urls` — suggestFollowUps tool and UI (gap: no handling of incomplete state after resume)
- `reduce-message-storage-size` — existing proposal for storage optimization (separate concern)

## Affected Specs

- `resumable-streaming` — new scenario for message persistence surviving client disconnect
- `chat-ui` — modified scenario for suggestions handling incomplete tool state
