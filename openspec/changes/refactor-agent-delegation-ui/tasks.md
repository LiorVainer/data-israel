## 1. Two-Pass Recall: Persist Sub-Agent Tool Calls on Page Reload

### 1.1 Add sub-agent recall logic to GET `/api/chat`

In `app/api/chat/route.ts`, after the existing `memory.recall()` and `toAISdkV5Messages()` calls:

1. Scan the UIMessages for `tool-agent-*` parts with `output.subAgentThreadId`
2. For each found sub-agent, call `memory.recall({ threadId: subAgentThreadId, resourceId: subAgentResourceId })`
3. Convert sub-agent messages via `toAISdkV5Messages()`
4. Extract tool invocations from the sub-agent's assistant messages
5. Build `data-tool-agent`-like structures (matching the streaming shape)
6. Inject reconstructed parts into the routing agent's UIMessages right after their `tool-agent-*` parent

Extract the reconstruction logic into a helper function `reconstructAgentDataParts` for clarity. See `design.md` for the detailed reconstruction algorithm.

- [x] 1.1 Done

---

## 2. Type Definitions for Agent Data Parts

### 2.1 Add typed interfaces to `components/chat/types.ts`

Add the following types for `data-tool-agent` parts:

- `AgentDataToolCall` — `{ toolCallId: string; toolName: string; args: Record<string, unknown> }`
- `AgentDataToolResult` — `{ toolCallId: string; toolName: string; args: Record<string, unknown>; result: Record<string, unknown> }`
- `AgentDataPartData` — `{ id: string; status: 'running' | 'finished'; text: string; toolCalls: AgentDataToolCall[]; toolResults: AgentDataToolResult[]; steps: unknown[]; finishReason: string; usage: {...} }`
- `isAgentDataPart(part)` — type guard checking `part.type === 'data-tool-agent'` and narrowing to typed shape

These interfaces match the runtime shape observed from Mastra's `handleChatStream` AND the shape produced by the reconstruction logic in task 1.1.

- [x] 2.1 Done

---

## 3. Refactor `buildAgentInternalCallsMap` in `ToolCallParts.tsx`

### 3.1 Enrich `AgentInternalToolCall` interface

Add `toolCallId: string` and `isComplete: boolean` fields. `isComplete` is derived by checking if the tool call's `toolCallId` has a matching entry in `toolResults`.

- [x] 3.1 Done

### 3.2 Refactor `buildAgentInternalCallsMap` to use `isAgentDataPart`

Replace `as unknown as Record<string, unknown>` casts with the `isAgentDataPart` type guard. Access `data.id`, `data.toolCalls`, `data.toolResults` directly through typed fields. Derive `isComplete` by building a `Set<string>` of completed `toolCallId`s from `toolResults` and checking membership for each `toolCall`.

- [x] 3.2 Done

---

## 4. Enhance `AgentInternalCallsChain` in `ToolCallStep.tsx`

### 4.1 Pass `isAgentActive` to `AgentInternalCallsChain`

Add `isAgentActive: boolean` prop (sourced from `GroupedToolCall.isActive`). This tells the chain whether the parent agent tool is still running.

- [x] 4.1 Done

### 4.2 Add per-step status derivation

Each `ChainOfThoughtStep` gets its status from the call's state:
- `isComplete=true` → `status='complete'`
- `isComplete=false && isAgentActive` → `status='active'`
- `isComplete=false && !isAgentActive` → `status='complete'` (agent finished, treat as done)

- [x] 4.2 Done

### 4.3 Add completion descriptions

Each completed step shows a description:
- Error: `<span className='text-red-500'>שגיאה: {call.error}</span>` (existing)
- Success with `searchedResourceName`: show the resource name as description
- Success without `searchedResourceName`: show `"הושלם"`

- [x] 4.3 Done

### 4.4 Add `LoadingShimmer` for active steps

When `status='active'` (not complete and agent is active), render `<LoadingShimmer showIcon={false} showText text="מעבד..." />` as children of the `ChainOfThoughtStep`.

- [x] 4.4 Done

---

## 5. Absorb `data-tool-agent` in Segmentation (`MessageItem.tsx`)

### 5.1 Absorb `data-tool-agent` parts into preceding `tool-group`

In `segmentMessageParts`, add a check: if `part.type === 'data-tool-agent'` and the last segment is a `tool-group`, absorb it (discard from segments — it's consumed via `allParts` by `buildAgentInternalCallsMap`). If no preceding `tool-group`, treat as a regular part (renders as `null` — safe fallback).

- [x] 5.1 Done

---

## 6. Cleanup

### 6.1 Remove `console.log` debug statements

Remove debug `console.log` calls in:
- `ToolCallParts.tsx` line 247: `console.log('Agent calls map:', agentCallsMap)`
- `ToolCallStep.tsx` line 114: `console.log({ step, hasInternalCalls })`
- `MessageItem.tsx` line 48: `console.log({ parts })`
- `app/api/chat/route.ts` line 39: `console.log({ steps: steps.length })`
- `app/api/chat/route.ts` line 109: `console.log('Received chat request...')`
- `app/api/chat/route.ts` line 125: `console.log(params)`

- [x] 6.1 Done

---

## 7. Verification

- [x] 7.1 Run `tsc` — no type errors
- [x] 7.2 Run `npm run build` — production build succeeds
- [x] 7.3 Run `npm run eslint` — no new linting issues
- [ ] 7.4 Manual browser testing — live streaming:
  - DataGov query: verify sub-agent tool calls render with loading → completed states
  - Verify completed steps show description ("הושלם" or resource name)
  - Verify active steps show `LoadingShimmer` while agent is running
  - Verify error steps show red error text
  - Verify charts, sources, and suggestions still work
- [ ] 7.5 Manual browser testing — page reload:
  - Reload the page on an existing thread with sub-agent tool calls
  - Verify `AgentInternalCallsChain` shows the sub-agent's tool calls (not empty)
  - Verify tool names, icons, and resource names display correctly
  - Verify sources and charts still render on reload
