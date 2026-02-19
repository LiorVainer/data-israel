# Design: Refactor Agent Delegation UI

## Memory Architecture Discovery

### What Mastra Stores Per Thread

When `routingAgent` calls `agent-datagovAgent`, two threads are created:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Routing Agent Thread (threadId from frontend UUID)                  │
│                                                                     │
│  user message: "חפש נתונים על רכבים חשמליים"                       │
│  assistant message:                                                 │
│    ├── tool-invocation: agent-datagovAgent                         │
│    │     args: { prompt: "..." }                                   │
│    │     result: { text: "...",                                    │
│    │              subAgentThreadId: "74c5f574-...",                │
│    │              subAgentResourceId: "routingAgent-datagovAgent" }│
│    ├── tool-invocation: displayLineChart                           │
│    ├── tool-invocation: suggestFollowUps                           │
│    └── text: "הנה הנתונים שמצאתי..."                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Sub-Agent Thread (threadId = "74c5f574-...")                        │
│ resourceId = "routingAgent-datagovAgent"                            │
│                                                                     │
│  user message: "חפש נתונים על מספר הרכבים החשמליים..."             │
│  assistant message:                                                 │
│    ├── tool-invocation: searchDatasets (x4)                        │
│    ├── tool-invocation: getDatasetDetails (x2)                     │
│    ├── tool-invocation: searchDatasets (x3)                        │
│    └── text: "" (sub-agent finishReason: "tool-calls")             │
└─────────────────────────────────────────────────────────────────────┘
```

### What's Lost on Reload (Current Behavior)

During live streaming, `data-tool-agent` parts aggregate the sub-agent's execution into a single object:

```json
{
  "type": "data-tool-agent",
  "id": "3aee6bec-...",
  "data": {
    "id": "datagovAgent",
    "toolCalls": [/* 9 tool calls */],
    "toolResults": [/* 9 results */],
    "steps": [/* 5 steps */],
    "status": "finished"
  }
}
```

This is created by `AgentStreamToAISDKTransformer.transformAgent()` during SSE streaming and NEVER stored — it's purely a streaming UI artifact. On page reload, `buildAgentInternalCallsMap` finds no `data-tool-agent` parts, so `AgentInternalCallsChain` renders empty.

## Two-Pass Recall Strategy

### GET `/api/chat` Flow

```
Client loads /chat/:id
  → GET /api/chat?threadId=<uuid>&resourceId=<userId>
  → Pass 1: memory.recall({ threadId, resourceId })
      → returns MastraDBMessage[] for routing agent thread
      → toAISdkV5Messages() → UIMessage[]
  → Parse: scan UIMessages for tool-agent-* parts
      → find parts where type.startsWith('tool-agent-')
      → extract output.subAgentThreadId, output.subAgentResourceId
  → Pass 2: for each sub-agent found:
      → memory.recall({ threadId: subAgentThreadId, resourceId: subAgentResourceId })
      → toAISdkV5Messages() → sub-agent UIMessage[]
      → extract tool invocations from assistant messages
  → Reconstruct: build data-tool-agent-like structures
      → map sub-agent tool invocations to AgentDataToolCall/AgentDataToolResult format
  → Inject: insert reconstructed parts into routing agent UIMessages
      → placed right after the corresponding tool-agent-* part
  → Return enriched UIMessage[] to client
```

### Reconstructing `data-tool-agent` Parts from Stored Messages

The sub-agent's stored messages contain `tool-invocation` DB parts which convert to `tool-${toolName}` UIMessage parts via `toAISdkV5Messages`. We extract these and build the same shape the streaming path produces:

```typescript
// Pseudo-code for reconstruction
function reconstructAgentDataPart(
    agentName: string,
    subAgentMessages: UIMessage[]
): { type: 'data-tool-agent'; id: string; data: AgentDataPartData } {
    const toolCalls: AgentDataToolCall[] = [];
    const toolResults: AgentDataToolResult[] = [];

    for (const msg of subAgentMessages) {
        if (msg.role !== 'assistant') continue;
        for (const part of msg.parts) {
            if (!part.type.startsWith('tool-')) continue;
            const toolPart = part as ToolCallPart;
            const toolName = part.type.replace('tool-', '');

            toolCalls.push({
                toolCallId: toolPart.toolCallId ?? '',
                toolName,
                args: (toolPart.input ?? {}) as Record<string, unknown>,
            });

            if (toolPart.state === 'output-available') {
                toolResults.push({
                    toolCallId: toolPart.toolCallId ?? '',
                    toolName,
                    args: (toolPart.input ?? {}) as Record<string, unknown>,
                    result: (toolPart.output ?? {}) as Record<string, unknown>,
                });
            }
        }
    }

    return {
        type: 'data-tool-agent',
        id: agentName,
        data: {
            id: agentName,
            status: 'finished',
            text: '',
            toolCalls,
            toolResults,
            steps: [],
            finishReason: 'tool-calls',
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        },
    };
}
```

### Injection into UIMessages

The reconstructed part must be placed right after the `tool-agent-*` part it belongs to, so the client's `buildAgentInternalCallsMap` picks it up the same way it does during streaming:

```typescript
// After reconstruction, inject into the message's parts array
for (const msg of uiMessages) {
    const injections: Array<{ afterIndex: number; part: unknown }> = [];

    for (let i = 0; i < msg.parts.length; i++) {
        const part = msg.parts[i];
        if (part.type.startsWith('tool-agent-')) {
            const agentName = part.type.replace('tool-agent-', '');
            const reconstructed = reconstructedParts.get(agentName);
            if (reconstructed) {
                injections.push({ afterIndex: i, part: reconstructed });
            }
        }
    }

    // Insert in reverse order to preserve indices
    for (const inj of injections.reverse()) {
        msg.parts.splice(inj.afterIndex + 1, 0, inj.part as UIMessage['parts'][number]);
    }
}
```

## Why This Approach

| Approach | Pros | Cons |
|---|---|---|
| **A: Two-pass recall (chosen)** | No custom storage; data already exists; uses public Mastra API | Extra recall call(s) per page load; reconstruction logic |
| B: Stream interception | Captures exact streaming shape | Requires wrapping `agentObj.stream()`; complex plumbing |
| C: `onStepFinish` + custom store | Captures at the right moment | Needs separate Convex table; mapping maintenance |
| D: Mastra-native | Cleanest if available | No built-in API for "get sub-agent threads for parent" |

Option A wins because:
- The data is already stored — we just need to read it
- Zero extra storage cost — no new Convex tables
- Zero streaming changes — the POST handler is untouched
- The `memory.recall()` API is public and stable
- Reconstruction is straightforward (map stored tool-invocations to the same shape)

## Type Safety Strategy

### Local Interfaces Over `@mastra/ai-sdk` Imports

The exported `AgentDataPart` type from `@mastra/ai-sdk` uses internal `LLMStepResult` which doesn't expose `toolCalls`/`toolResults` as typed arrays. Our local interfaces match the actual runtime shape (confirmed by console output) and give direct typed access to exactly the fields we need.

### `isComplete` Derivation

```typescript
const resultIds = new Set(data.toolResults.map(tr => tr.toolCallId));
const isComplete = resultIds.has(toolCall.toolCallId);
```
