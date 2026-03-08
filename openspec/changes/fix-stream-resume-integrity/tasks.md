# Tasks: fix-stream-resume-integrity

## 1.0 Enable incremental message saving

- [x] 1.1 Add `savePerStep: true` to `defaultOptions` in `app/api/chat/route.ts`:

```typescript
// app/api/chat/route.ts — handleChatStream call
defaultOptions: {
    savePerStep: true,  // persist messages after each step (survives page refresh)
    toolCallConcurrency: CHAT.TOOL_CALL_CONCURRENCY,
    // ... rest unchanged
}
```

- [ ] 1.2 Verify in dev: send a message, refresh mid-stream, reload page — user message and completed steps should appear in recalled messages

## 2.0 Fix suggestFollowUps — accept input-available state

- [x] 2.1 In `components/chat/ChatThread.tsx`, modify the `suggestionsFromTool` memo — treat `input-available` same as `output-available` (extract suggestions from input). Keep `!isStreaming` render guard unchanged.

```typescript
// components/chat/ChatThread.tsx — suggestionsFromTool memo

// Only input-streaming is a loading state now
if (state === 'input-streaming') {
    return { suggestions: undefined, loading: true };
}

// suggestFollowUps is a passthrough (input === output).
// Accept both input-available and output-available.
if ((state === 'input-available' || state === 'output-available') && 'input' in suggestPart) {
    const input = suggestPart.input as { suggestions: string[] };
    return { suggestions: input.suggestions, loading: false };
}
```

- [x] 2.2 Verify the render guard stays unchanged (`!isStreaming`) — suggestions only display after stream ends

## 3.0 Unit tests

- [x] 3.1 Create `components/chat/__tests__/suggestions-extraction.test.ts` with vitest tests for the suggestions extraction logic:

```typescript
// Test cases:
// 1. input-streaming → { suggestions: undefined, loading: true }
// 2. input-available with suggestions → { suggestions: [...], loading: false }
// 3. output-available with suggestions → { suggestions: [...], loading: false }
// 4. no suggestFollowUps part → { suggestions: undefined, loading: false }
// 5. input-available with empty suggestions array → { suggestions: [], loading: false }
```

- [x] 3.2 Extract the suggestions extraction logic from the `useMemo` into a pure function (`extractSuggestions`) so it can be tested without React hooks
- [x] 3.3 Run `npm run test` to verify all tests pass

## 4.0 Validate end-to-end

- [ ] 4.1 Test normal flow: send message, wait for completion — suggestions appear, messages saved correctly
- [ ] 4.2 Test refresh flow: send message, refresh mid-stream — user message persisted, suggestions render from input
- [ ] 4.3 Test new conversation flow: `?new` param — no loading flash, messages save correctly
