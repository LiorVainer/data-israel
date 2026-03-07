# Mastra Sub-Agent Empty Text Research — 2026-03-06

## Problem Statement

Sub-agents (datagovAgent, cbsAgent) return `text: ""` to the routing agent despite making 16+ successful tool calls with real data. Debug output:
```
[debug] Sub-agent "agent-datagovAgent" result: {
    "text": "",
    "subAgentThreadId": "...",
    "subAgentResourceId": "..."
}
```

The routing agent reads `result.text`, sees empty string, and reports "not found".

## Root Cause: How Mastra Extracts Sub-Agent Text

**Source:** `@mastra/core` compiled JS (`chunk-BCSVBOAN.cjs:20572-20647`)

When a routing agent delegates to a sub-agent, Mastra:
1. Calls `agent.stream()` on the sub-agent
2. Iterates `fullStream` chunks
3. **Only accumulates text from `text-delta` chunks:**
   ```javascript
   let fullText = "";
   for await (const chunk of streamResult.fullStream) {
     if (chunk.type === "text-delta") {
       fullText += chunk.payload.text;
     }
   }
   result = { text: fullText, subAgentThreadId, subAgentResourceId };
   ```

`text-delta` chunks are only emitted when the LLM generates text (not tool calls). If the sub-agent uses ALL steps for tool calls without a final text-generation step, `fullText` stays `""`.

### Why Sub-Agents Exhaust Steps

For complex queries (e.g., train accuracy), a sub-agent needs 7-11+ tool calls:
- `searchDatasets` (1 call)
- `getDatasetDetails` (1-2 calls)
- `getResourceDetails` (1-2 calls)
- `queryDatastoreResource` with limit=3 for probing (2-3 calls)
- `queryDatastoreResource` with full data (1-2 calls)
- `generateDataGovSourceUrl` (1 call)

Each tool call uses 2 steps (LLM decision + execution). 16 tool calls = 32 steps, leaving no room for text generation.

### maxSteps Flow

Sub-agent `maxSteps` comes from `inputData.maxSteps` in the tool call schema:
```javascript
let effectiveMaxSteps = inputData.maxSteps;  // line 20327
// Only passed if truthy:
...effectiveMaxSteps && { maxSteps: effectiveMaxSteps },  // line 20561
```
The routing agent does NOT pass `maxSteps` explicitly, so sub-agents may get undefined or AI SDK defaults.

## Mastra Processor API

### `processInputStep` — Per-Step Hook

**Source:** `@mastra/core/dist/processors/index.d.ts:105-170`

Runs before each LLM step in the agentic loop. Key types:

```typescript
interface ProcessInputStepArgs {
    stepNumber: number;        // 0-indexed
    steps: Array<StepResult>;  // Previous step results
    systemMessages: CoreMessageV4[];
    tools?: Record<string, unknown>;
    toolChoice?: ToolChoice<any>;
}

type ProcessInputStepResult = {
    toolChoice?: ToolChoice<any>;   // Can set to 'none' to force text!
    systemMessages?: CoreMessageV4[];
    tools?: Record<string, unknown>;
};
```

Returning `{ toolChoice: 'none' }` prevents tool calls on the next LLM step, forcing text generation.

### Registration

Via `inputProcessors` on Agent constructor (`agent/types.d.ts:206`):
```typescript
inputProcessors?: DynamicArgument<InputProcessorOrWorkflow[]>;
```

### Existing Processor: ToolResultSummarizerProcessor

`agents/processors/tool-result-summarizer.processor.ts` uses `processOutputResult` to detect empty text with tool invocations and generate a summary. However, this runs AFTER streaming completes — for sub-agents, `text` is already extracted during streaming, so this processor can't fix the sub-agent issue.

## Mastra Delegation Hooks

**Source:** `@mastra/core/dist/agent/agent.types.d.ts:54-155`

### `onDelegationStart`

Called before sub-agent executes:
```typescript
interface DelegationStartContext {
    primitiveId: string;
    prompt: string;
    params: { maxSteps?: number; };
    iteration: number;
    messages: MastraDBMessage[];
}

interface DelegationStartResult {
    proceed?: boolean;
    modifiedPrompt?: string;
    modifiedInstructions?: string;
    modifiedMaxSteps?: number;  // Set explicit step budget
}
```

### `onDelegationComplete`

Called after sub-agent returns:
```typescript
interface DelegationCompleteContext {
    result: { text: string; subAgentThreadId?: string; };
    success: boolean;
    error?: Error;
    bail: () => void;  // Stop concurrent delegations
}

interface DelegationCompleteResult {
    feedback?: string;  // Injected into routing agent conversation
}
```

### How to Pass Hooks

Via `delegation` in `AgentExecutionOptions` (`agent.types.d.ts:516`):
```typescript
delegation?: DelegationConfig;
```

Confirmed passable through `handleChatStream`'s `defaultOptions` (`@mastra/ai-sdk/dist/chat-route.d.ts:15`):
```typescript
defaultOptions?: AgentExecutionOptions<OUTPUT>;
```

## Multi-Turn Delegation (Ping-Pong)

### Finding: Natively Supported

The routing agent can call `tool-agent-datagovAgent` multiple times in one conversation. Each call is a regular tool call in the routing agent's agentic loop. No framework changes needed.

Evidence:
- Sub-agent tool calls are standard Mastra tools created per agent in `agents: {}` config
- Each call can create/reuse a sub-agent thread
- The routing agent's loop continues normally between delegations
- `DelegationStartContext` includes `iteration` (1-based) tracking call count

### How It Works

```
Routing agent step 1: LLM decides to call tool-agent-datagovAgent
  -> Sub-agent runs, returns { text, subAgentThreadId }
Routing agent step 2: LLM sees sub-agent result
  -> Decides to call tool-agent-datagovAgent AGAIN with different prompt
  -> Sub-agent runs again, returns { text, subAgentThreadId }
Routing agent step 3: LLM synthesizes both results
  -> Generates final text response
```

Implementation: Purely instruction-based — tell routing agent to delegate incrementally.

## Approaches Considered

| Approach | Mechanism | Verdict |
|----------|-----------|---------|
| `processInputStep` + `toolChoice: 'none'` | Framework-enforced after N steps | **Selected** — most reliable |
| Delegation hooks | `onDelegationStart` for maxSteps, `onDelegationComplete` for feedback | **Selected** — safety net |
| Incremental delegation instructions | Routing agent breaks tasks into smaller delegations | **Selected** — reduces complexity |
| Instruction-only ("must write text") | Sub-agent instructions demand text output | **Tried, unreliable** — model ignores under step pressure |
| `ToolResultSummarizerProcessor` | Existing `processOutputResult` processor | **Insufficient** — runs after stream, too late for sub-agent text |
| Custom `stopWhen` on sub-agents | Control when sub-agent loop stops | **Rejected** — we need text generation, not early stopping |
| Migrate to supervisor pattern | Replace `.network()` with supervisor | **Deferred** — too large a change for this fix |

## Key Files

| File | Purpose |
|------|---------|
| `@mastra/core/dist/chunk-BCSVBOAN.cjs:20572-20647` | Sub-agent stream text extraction |
| `@mastra/core/dist/chunk-BCSVBOAN.cjs:20310-20330` | effectiveMaxSteps extraction |
| `@mastra/core/dist/processors/index.d.ts:105-170` | ProcessInputStepArgs/Result types |
| `@mastra/core/dist/agent/agent.types.d.ts:54-155` | Delegation hook types |
| `@mastra/core/dist/agent/agent.types.d.ts:490-516` | DelegationConfig on AgentExecutionOptions |
| `@mastra/ai-sdk/dist/chat-route.d.ts:15` | handleChatStream defaultOptions type |
| `agents/processors/tool-result-summarizer.processor.ts` | Existing output processor |
| `agents/network/routing/routing.agent.ts:36-63` | Routing agent factory |
| `agents/network/datagov/data-gov.agent.ts:18-34` | DataGov agent factory |
| `app/api/chat/route.ts:272-356` | handleChatStream call |
| `agents/agent.config.ts:46` | MAX_STEPS = 25 default |
