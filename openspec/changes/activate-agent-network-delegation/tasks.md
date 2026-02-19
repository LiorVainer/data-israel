## 1. Backend: Wire Agent Network

### 1.1 Simplify CBS Agent

Remove `outputProcessors`, `memory`, and related imports from `agents/network/cbs/cbs.agent.ts`. The CBS agent should only have: `id`, `name`, `description`, `instructions`, `model`, `tools: CbsTools`.

- [x] 1.1 Done

---

### 1.2 Simplify DataGov Agent

Remove `outputProcessors`, `memory`, and related imports from `agents/network/datagov/data-gov.agent.ts`. The DataGov agent should only have: `id`, `name`, `description`, `instructions`, `model`, `tools: DataGovTools`.

- [x] 1.2 Done

---

### 1.3 Wire Sub-Agents into Routing Agent

In `agents/network/routing/routing.agent.ts`:
1. Import `cbsAgent` and `datagovAgent`
2. Add `agents: { datagovAgent, cbsAgent }` property
3. Remove `CbsTools` and `DataGovTools` from `tools` spread (keep only `ClientTools`)
4. Remove CBS/DataGov tool imports

```typescript
// Before
import { ClientTools } from '@/lib/tools/client';
import { DataGovTools } from '@/lib/tools/datagov';
import { CbsTools } from '@/lib/tools/cbs';

tools: {
    ...ClientTools,
    ...CbsTools,
    ...DataGovTools,
},

// After
import { ClientTools } from '@/lib/tools/client';
import { cbsAgent } from '../cbs';
import { datagovAgent } from '../datagov';

agents: { datagovAgent, cbsAgent },
tools: {
    ...ClientTools,
},
```

- [x] 1.3 Done

---

### 1.4 Register Sub-Agents in Mastra Instance

In `agents/mastra.ts`, import and register `cbsAgent` and `datagovAgent`:

```typescript
import { routingAgent, cbsAgent, datagovAgent } from './network';

export const agents = { routingAgent, cbsAgent, datagovAgent };
```

Ensure the barrel export in `agents/network/index.ts` re-exports both sub-agents.

- [x] 1.4 Done

---

## 2. Backend: Switch to handleNetworkStream

### 2.1 Replace handleChatStream with handleNetworkStream

In `app/api/chat/route.ts`:
1. Change import: `handleNetworkStream` instead of `handleChatStream`
2. Replace the call: `handleNetworkStream<AppUIMessage>({...})` — same params

```typescript
// Before
import { handleChatStream } from '@mastra/ai-sdk';
const stream = await handleChatStream<AppUIMessage>({ ... });

// After
import { handleNetworkStream } from '@mastra/ai-sdk';
const stream = await handleNetworkStream<AppUIMessage>({ ... });
```

All other options (`defaultOptions`, `sendReasoning`, `sendSources`) stay the same.

- [x] 2.1 Done

---

## 3. Frontend: Type Definitions for Network Data

### 3.1 Add extended network step types to `components/chat/types.ts`

The exported `NetworkDataPart.data.steps` is typed as `StepResult[]` (minimal: name, status, input, output). But at runtime, Mastra's `transformNetwork()` extends each step with `id`, `iteration`, and `task` (containing `LLMStepResult` with `toolCalls`/`toolResults`). These survive JSON serialization but aren't in the public type.

Add local types to bridge this gap:

```typescript
import type { NetworkDataPart } from '@mastra/ai-sdk';

/** Tool call info extracted from a network step's task field */
export interface NetworkToolCall {
    toolCallId: string;
    toolName: string;
    args?: Record<string, unknown>;
    output?: unknown;
    isError?: boolean;
}

/**
 * Extended network step with runtime fields from Mastra's transformNetwork().
 * The typed StepResult only has name/status/input/output, but at runtime
 * each step also carries `task` with full LLMStepResult data including toolCalls.
 *
 * @see node_modules/@mastra/ai-sdk/dist/transformers.d.ts lines 249-255
 */
export interface NetworkStepWithTask {
    name: string;
    status: string;
    input: Record<string, unknown> | null;
    output: unknown | null;
    id?: string;
    iteration?: number;
    task?: {
        toolCalls?: Array<{ type: string; payload: NetworkToolCall }>;
        toolResults?: Array<{ type: string; payload: NetworkToolCall }>;
        text?: string;
        usage?: Record<string, unknown>;
    } | null;
}

/** Type guard to safely access the extended step fields */
export function hasTaskData(step: unknown): step is NetworkStepWithTask & { task: NonNullable<NetworkStepWithTask['task']> } {
    return (
        typeof step === 'object' &&
        step !== null &&
        'task' in step &&
        typeof (step as Record<string, unknown>).task === 'object' &&
        (step as Record<string, unknown>).task !== null
    );
}
```

This avoids `as` casts — use the `hasTaskData` type guard to narrow safely.

- [x] 3.1 Done

---

## 4. Frontend: Refactor Network Data Parts Rendering

All `data-network` parts render via `AgentsNetworkDataParts.tsx` inline in the message parts array — same pattern as `ToolCallParts.tsx` renders tool groups. Each agent step is split to show its individual tool calls.

### 4.1 Refactor `AgentsNetworkDataParts.tsx`

This is the **container component** (parallel to `ToolCallParts.tsx`). It receives `NetworkDataPart[]` from `MessageItem.tsx` segmentation and renders a `ChainOfThought` accordion where **each agent step is expanded to show its individual tool calls**.

**Props** (mirrors ToolCallParts):
```typescript
interface AgentsNetworkDataPartsProps {
    messageId: string;
    networkParts: NetworkDataPart[];
    isProcessing: boolean;
    defaultOpen?: boolean;
}
```

**Grouping logic**:
1. Flatten all `networkPart.data.steps` from all parts
2. Filter out `routing-agent` / `routingAgent` steps
3. For each agent step, extract tool calls from `step.task.toolCalls` using the `hasTaskData` type guard
4. Group by agent name → produce `GroupedAgentStep[]`:
   ```typescript
   interface GroupedAgentStep {
       agentName: string;       // e.g. 'cbsAgent'
       isActive: boolean;
       isFailed: boolean;
       toolCalls: NetworkToolCall[];  // individual tools this agent called
   }
   ```

**UI behavior** (matching ToolCallParts):
- Rotating Hebrew processing labels: `['מנתב לסוכנים...', 'מעבד נתונים...', 'מנתח תוצאות...']`
- Stats header: `"X סוכנים הושלמו"` / `"(Y שגיאות)"`
- `userToggled` + auto-open during processing
- Each grouped agent step rendered via `<AgentNetworkDataStep>`

- [x] 4.1 Done

---

### 4.2 Refactor `AgentNetworkDataStep.tsx`

This is the **step component** (parallel to `ToolCallStep.tsx`). Renders a single agent with its tool calls nested underneath.

**Props**:
```typescript
interface AgentNetworkDataStepProps {
    step: GroupedAgentStep;
}
```

**Rendering**:
- Top level: `ChainOfThoughtStep` with agent icon + Hebrew label from `AgentsDisplayMap`
- Status description: "בפעולה..." (active with `DataIsraelLoader`), "הושלם" (complete), "שגיאה" (error in red)
- **Nested tool calls**: Inside the step's children, render each tool call using the existing `getToolInfo()` from `MessageToolCalls.tsx` to get icons/names:
  ```
  [Agent: cbsAgent - "בודק בנתוני הלמ"ס"]
    ├── browseCbsCatalog - "חיפוש בקטלוג הלמ"ס"
    └── getCbsSeriesData - "שליפת נתוני סדרה"
  ```
- Use `ChainOfThoughtSearchResults` + `ChainOfThoughtSearchResult` to display tool names as nested items (same pattern as `ToolCallStep` shows resources)
- Data source config badges (linking to CBS / data.gov.il) on the agent-level step

- [x] 4.2 Done

---

### 4.3 Integrate Network Data Parts in `MessageItem.tsx`

Add `data-network` parts to the segmentation and rendering pipeline — they appear as segments in the message array alongside tool-group and part segments:

1. **Segment type**: Add `'network-group'` kind to `RenderSegment` union:
   ```typescript
   | { kind: 'network-group'; networkParts: NetworkDataPart[] }
   ```
2. **Detection**: Use the existing `isAgentsNetworkDataPart()` type guard from `types.ts`
3. **Segmentation**: In `segmentMessageParts()`, detect `part.type === 'data-network'` and accumulate consecutive network parts into a `'network-group'` segment (same grouping logic as consecutive tool parts into `'tool-group'`)
4. **Rendering**: In the segments map, handle `'network-group'` by rendering `<AgentsNetworkDataParts>` with the grouped parts, `isProcessing`, and `defaultOpen` — identical pattern to how `<ToolCallParts>` is rendered for `'tool-group'` segments

This means `data-network` parts appear chronologically in the message where they were emitted, interleaved with text and tool segments as they naturally occur.

- [x] 4.3 Done

---

## 5. Post-Implementation Fixes

- [x] 5.1 Fix raw JSON dumping: Added conciseness instructions to routing agent, CBS agent, and DataGov agent configs
- [x] 5.2 Fix max iterations: Increased AI_MAX_STEPS default from 10 to 25 in lib/env.ts
- [x] 5.3 Fix memory warnings: Added Memory back to CBS and DataGov sub-agents
- [x] 5.4 Fix runtime TypeError: Created RawNetworkToolCallEntry type with flat+wrapped shape handling

---

## 6. Verification

- [x] 6.1 Run `tsc` — no type errors
- [x] 6.2 Run `npm run build` — production build succeeds
- [x] 6.3 Run `npm run eslint` — no new linting issues (4 pre-existing errors only)
- [ ] 6.4 Manual browser testing:
  - DataGov query: verify datagovAgent step renders with its tool calls listed underneath
  - CBS query: verify cbsAgent step renders with its tool calls listed underneath
  - Mixed query: verify both agents appear in network timeline, each with their own tools
  - Verify tool names/icons match existing `toolIconMap` and `toolTranslations`
  - Verify source URLs and suggestions still work
  - Verify charts still render correctly

---

## 7. Guarantee Text + suggestFollowUps in Every Network Stream

- [x] 7.1 Remove `hasCompletedWithSuggestions` stopWhen + `maxSteps` from `app/api/chat/route.ts`
- [x] 7.2 Create `SuggestFollowUpsProcessor` in `agents/processors/suggest-follow-ups.processor.ts`
- [x] 7.3 Wire processor to routing agent via `outputProcessors`
- [x] 7.4 Create `ensureSuggestFollowUps` stream wrapper in `app/api/chat/route.ts`
- [x] 7.5 Update routing instructions in `agents/network/routing/config.ts`
- [x] 7.6 Verify `tsc` and `npm run build` pass
