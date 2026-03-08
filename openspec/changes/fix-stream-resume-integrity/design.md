# Design: fix-stream-resume-integrity

## Problem Analysis

### Current message saving flow (default: `savePerStep: false`)

```
User sends message
  -> POST /api/chat
  -> handleChatStream -> agent.stream(messages, mergedOptions)
  -> Step 1: tool calls (e.g., agent-datagovAgent delegation)
  -> Step 2: more tool calls (charts, suggestFollowUps)
  -> Step 3: final text
  -> onFinish fires:
       if (!abortSignal.aborted) {        // <-- GATE
         executeOnFinish()                 // saves ALL messages to Convex
       }
       options.onFinish()                  // billing, clearActiveStreamId
```

When the user refreshes mid-stream, `abortSignal.aborted` becomes `true`, and `executeOnFinish()` is skipped entirely. No messages are saved.

### Fixed flow with `savePerStep: true`

```
User sends message
  -> POST /api/chat
  -> handleChatStream -> agent.stream(messages, { savePerStep: true, ... })
  -> Step 1 completes:
       saveStepMessages() -> drainUnsavedMessages() -> saves user msg + step 1 results
  -> Step 2 completes:
       saveStepMessages() -> drainUnsavedMessages() -> saves step 2 results
  -> [User refreshes here — abortSignal fires]
  -> onFinish: aborted=true, executeOnFinish skipped
  -> BUT: steps 1-2 messages are already in Convex
```

### suggestFollowUps state machine

The AI SDK tool part lifecycle:

```
input-streaming -> input-available -> output-available
                                   -> output-error
```

During normal streaming, the tool goes through all states. When the stream is interrupted between `input-available` and `output-available`, the tool stays in `input-available` permanently.

Since `suggestFollowUps` is a passthrough (`execute: (input) => ({ suggestions: input.suggestions })`), the suggestions data is identical in both `input` and `output`. We can safely read from `input` when state is `input-available`.

## Decision: Why `savePerStep` over eager user message save

**Option A: `savePerStep: true`** (chosen)
- Built-in Mastra feature, single config flag
- Saves ALL step results incrementally, not just the user message
- Works for delegated sub-agent results too
- Slight increase in Convex writes (2-4 per turn instead of 1)

**Option B: Manually save user message before streaming**
- Requires custom code to call `memory.saveMessages()` before `handleChatStream`
- Risk of duplicate user messages if `onFinish` also saves it
- Doesn't help with intermediate step results
- More code to maintain

Option A is simpler, more complete, and leverages the framework.

## Changes

### 1. `app/api/chat/route.ts`

Add `savePerStep: true` to the `defaultOptions` passed to `handleChatStream`:

```typescript
defaultOptions: {
    savePerStep: true,  // <-- NEW: persist messages after each step
    toolCallConcurrency: CHAT.TOOL_CALL_CONCURRENCY,
    // ... rest unchanged
}
```

### 2. `components/chat/ChatThread.tsx`

In the `suggestionsFromTool` memo, treat `input-available` as completed (extract suggestions from input):

```typescript
// Before:
if (state === 'input-streaming' || state === 'input-available') {
    return { suggestions: undefined, loading: true };
}
if (state === 'output-available' && 'input' in suggestPart) {
    const input = suggestPart.input as { suggestions: string[] };
    return { suggestions: input.suggestions, loading: false };
}

// After:
if (state === 'input-streaming') {
    return { suggestions: undefined, loading: true };
}
// suggestFollowUps is a passthrough — input === output.
// Accept both input-available and output-available.
if ((state === 'input-available' || state === 'output-available') && 'input' in suggestPart) {
    const input = suggestPart.input as { suggestions: string[] };
    return { suggestions: input.suggestions, loading: false };
}

// The render guard stays gated by `!isStreaming` — suggestions only show after stream ends.
// No change needed there.
```
