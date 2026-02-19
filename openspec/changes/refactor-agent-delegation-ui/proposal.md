# Change: Refactor Agent Delegation UI Types and Rendering

## Why

After the `revert-to-chat-stream` change, sub-agent delegation works via `handleChatStream` which emits two companion parts per sub-agent call:

1. `tool-agent-datagovAgent` / `tool-agent-cbsAgent` — standard tool parts (grouped by `segmentMessageParts`)
2. `data-tool-agent` — companion data parts with the sub-agent's internal tool calls, results, and steps

The current implementation has four problems:

### 1. Sub-Agent Tool Calls Lost on Page Reload
`data-tool-agent` parts are **streaming-only artifacts** — they are created by `AgentStreamToAISDKTransformer` during SSE streaming and are never stored in Mastra's memory. The routing agent's stored tool result only contains `{ text, subAgentThreadId, subAgentResourceId }`. On page reload, `AgentInternalCallsChain` has no data and the nested ChainOfThought is empty.

**However**, the sub-agent's internal tool calls ARE stored — in a **separate Convex thread** under `subAgentThreadId`. The solution is a two-pass recall in the GET endpoint.

### 2. Weak Type Safety
`buildAgentInternalCallsMap` in `ToolCallParts.tsx` uses `as unknown as Record<string, unknown>` to access `data-tool-agent` part fields. The `AgentInternalToolCall` interface is minimal — it only captures `toolName`, `searchedResourceName`, `success`, and `error`, losing richer data available from the stream (like step status, active/loading state).

### 3. No Loading State in Sub-Agent Steps
`AgentInternalCallsChain` in `ToolCallStep.tsx` renders all internal calls with `status='complete'` — there is no loading/active state. When a sub-agent is still running, its internal tool calls should show a `LoadingShimmer` instead of static "completed" status.

### 4. No Completion Description Per Step
Each `ChainOfThoughtStep` in `AgentInternalCallsChain` shows only the tool name and error text. Completed steps should show a short description (e.g., "הושלם" or the searched resource name) to match the pattern used by the top-level `ToolCallStep`.

## What Changes

### 1. Two-Pass Recall in GET `/api/chat` (`app/api/chat/route.ts`)

When recalling messages for page hydration:

1. **Pass 1:** Recall routing agent's thread (existing `memory.recall()`)
2. **Parse:** Scan recalled UIMessages for `tool-agent-*` parts with `output.subAgentThreadId`
3. **Pass 2:** For each found `subAgentThreadId`, call `memory.recall({ threadId: subAgentThreadId, resourceId: subAgentResourceId })` to get the sub-agent's stored messages
4. **Reconstruct:** Build `data-tool-agent`-like structures from the sub-agent's stored tool invocations
5. **Inject:** Insert reconstructed parts into the UIMessages array (after the corresponding `tool-agent-*` part) so the client has the same data shape as during live streaming

This uses Mastra's existing `memory.recall()` API — no custom storage needed.

### 2. Type-Safe `AgentDataPart` Interface (`components/chat/types.ts`)

Define proper interfaces for `data-tool-agent` parts to eliminate `Record<string, unknown>` casts:

```typescript
export interface AgentDataPartData {
    id: string;                    // agent name (e.g., 'datagovAgent')
    status: 'running' | 'finished';
    text: string;
    toolCalls: AgentDataToolCall[];
    toolResults: AgentDataToolResult[];
    steps: unknown[];
    finishReason: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}

export interface AgentDataToolCall {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
}

export interface AgentDataToolResult {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
}

export function isAgentDataPart(part: { type: string }): part is {
    type: 'data-tool-agent'; id: string; data: AgentDataPartData
} {
    return part.type === 'data-tool-agent';
}
```

### 3. Enriched `AgentInternalToolCall` Interface (`ToolCallParts.tsx`)

Extend the interface with `toolCallId` and `isComplete`:

```typescript
export interface AgentInternalToolCall {
    toolName: string;
    toolCallId: string;
    searchedResourceName?: string;
    success?: boolean;
    error?: string;
    isComplete: boolean;
}
```

Refactor `buildAgentInternalCallsMap` to use `isAgentDataPart` type guard and derive `isComplete` by matching `toolCalls` against `toolResults` by `toolCallId`.

### 4. `AgentInternalCallsChain` Improvements (`ToolCallStep.tsx`)

- Pass `isAgentActive` from parent `GroupedToolCall.isActive`
- Each `ChainOfThoughtStep` shows:
  - **Active/loading**: `LoadingShimmer` when `isAgentActive && !call.isComplete`
  - **Complete**: Description showing `searchedResourceName` or "הושלם"
  - **Error**: Red error text (existing behavior)
- Status derived from `call.isComplete` and parent `isAgentActive`

### 5. Absorb `data-tool-agent` Parts in Segmentation (`MessageItem.tsx`)

Absorb `data-tool-agent` parts into the preceding `tool-group` segment instead of rendering as `null`.

## Impact

- **Modified files**:
  - `app/api/chat/route.ts` — two-pass recall in GET handler, reconstruct `data-tool-agent` parts
  - `components/chat/types.ts` — add `AgentDataPartData`, `AgentDataToolCall`, `AgentDataToolResult`, `isAgentDataPart`
  - `components/chat/ToolCallParts.tsx` — refactor `AgentInternalToolCall`, `buildAgentInternalCallsMap`
  - `components/chat/ToolCallStep.tsx` — enhance `AgentInternalCallsChain` with loading state and descriptions
  - `components/chat/MessageItem.tsx` — absorb `data-tool-agent` parts in segmentation
- **UNCHANGED**: `lib/tools/**`, `agents/network/**`, `agents/mastra.ts`, `constants/**`
