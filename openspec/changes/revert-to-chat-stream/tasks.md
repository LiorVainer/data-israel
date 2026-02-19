## 1. Backend: Revert API Route to handleChatStream

### 1.1 Revert `app/api/chat/route.ts` to main branch version

Replace the entire file with the `main` branch version (`git show main:app/api/chat/route.ts`). Key differences:

**Imports** — replace:
```typescript
// REMOVE
import { createUIMessageStreamResponse, type InferUIMessageChunk } from 'ai';
import { handleNetworkStream } from '@mastra/ai-sdk';
// ADD
import { createUIMessageStreamResponse, StopCondition } from 'ai';
import { handleChatStream } from '@mastra/ai-sdk';
```

**Remove entirely** (lines 18-217 of current file):
- `StreamChunk` type alias
- `DEFAULT_SUGGESTIONS` constant
- `ensureStreamCompleteness()` function

**Remove entirely** (lines 247-380 of current file):
- `RecalledPart` / `RecalledMessage` interfaces
- `CHART_TYPE_TO_TOOL` constant
- `processNetworkTextPart()` function
- `SUGGEST_TOOL_TYPE` constant
- `sanitizeRecalledMessages()` function

**Restore stop condition** (from main branch):
```typescript
const hasCompletedWithSuggestions: StopCondition<any> = ({ steps }) => {
    console.log({ steps: steps.length });
    if (steps.length > CHAT.MAX_STEPS) return true;

    const lastStep = steps[steps.length - 1];
    const hasTextResponse = !!lastStep?.text && !lastStep?.toolCalls?.length;
    if (!hasTextResponse) return false;

    const calledSuggestions = steps.some((step) =>
        step.toolCalls?.some((tc: { toolName: string }) => tc.toolName === CHAT.SUGGEST_TOOL_NAME),
    );
    return calledSuggestions;
};
```

**POST handler** — replace `handleNetworkStream` call:
```typescript
const stream = await handleChatStream<AppUIMessage>({
    mastra,
    agentId: 'routingAgent',
    params: enhancedParams,
    defaultOptions: {
        toolCallConcurrency: CHAT.TOOL_CALL_CONCURRENCY,
        stopWhen: hasCompletedWithSuggestions,
        onFinish: ({ totalUsage, model }) => {
            // ... existing Convex mutation (keep as-is)
        },
    },
    sendReasoning: true,
    sendSources: true,
});

return createUIMessageStreamResponse({ stream });
```

**GET handler** — simplify to return raw recalled messages:
```typescript
const uiMessages = toAISdkV5Messages(response?.messages || []);
return NextResponse.json(uiMessages);
```

- [x] 1.1 Done

---

### 1.2 Remove `SuggestFollowUpsProcessor` from routing agent

In `agents/network/routing/routing.agent.ts`:
```typescript
// REMOVE this import
import { SuggestFollowUpsProcessor } from '../../processors/suggest-follow-ups.processor';

// REMOVE outputProcessors from the Agent constructor:
// outputProcessors: [new SuggestFollowUpsProcessor()],
```

Delete the file `agents/processors/suggest-follow-ups.processor.ts`.

`stopWhen: hasCompletedWithSuggestions` enforces `suggestFollowUps` natively — the processor is redundant.

- [x] 1.2 Done

---

## 2. Type Safety: Derived ToolIOMap and AgentsDisplayMap

### 2.1 Replace manual `ToolIOMap` with derived mapped type

In `lib/tools/types.ts`, replace lines 118-259 (the `NetworkAgentInput` type and `interface ToolIOMap { ... }`) with:

```typescript
import type { InferToolInput, InferToolOutput } from 'ai';
import type { ClientTools } from './client';
import type { DataGovTools } from './datagov';
import type { CbsTools } from './cbs';
import type { agents } from '@/agents/mastra';

// ============================================================================
// Tool Map Type (auto-derived from tool objects)
// ============================================================================

/** All tool objects combined — source of truth for tool names and schemas */
type AllToolObjects = typeof ClientTools & typeof DataGovTools & typeof CbsTools;

/** ToolIOMap for regular tools: input/output inferred from Zod schemas */
type DerivedToolIOMap = {
    [K in keyof AllToolObjects]: {
        input: InferToolInput<AllToolObjects[K]>;
        output: InferToolOutput<AllToolObjects[K]>;
    };
};

/** Agent-as-tool schema: Mastra converts sub-agents to tools with this fixed shape */
type NetworkAgentInput = { prompt: string };
type NetworkAgentOutput = { text: string };

/** ToolIOMap for agent-as-tool entries: derived from agents const */
type AgentToolIOMap = {
    [K in `agent-${Extract<keyof typeof agents, string>}`]: {
        input: NetworkAgentInput;
        output: NetworkAgentOutput;
    };
};

/** Combined map: regular tools + agent-as-tool entries */
export type ToolIOMap = DerivedToolIOMap & AgentToolIOMap;
```

Keep unchanged:
- All individual type re-exports above (`SearchDatasetsInput`, etc.)
- `ToolName`, `ToolInput<T>`, `ToolOutput<T>` at the bottom

- [x] 2.1 Done

---

### 2.2 Create type-safe `AgentsDisplayMap` in constants

Create new file `constants/agents-display.ts`:

```typescript
import { ActivityIcon, BarChart2Icon, DatabaseIcon, type LucideIcon } from 'lucide-react';
import type { AgentName } from '@/agents/types';
import type { DataSource } from '@/constants/tool-data-sources';

export interface AgentDisplayInfo {
    label: string;
    icon: LucideIcon;
    /** Data source for badge display — only for data-fetching agents */
    dataSource?: DataSource;
}

export const AgentsDisplayMap: Record<AgentName, AgentDisplayInfo> = {
    datagovAgent: { label: 'בודק במאגרי המידע הממשלתי', icon: DatabaseIcon, dataSource: 'datagov' },
    cbsAgent: { label: 'בודק בנתוני הלשכה המרכזית לסטטיסטיקה', icon: BarChart2Icon, dataSource: 'cbs' },
    routingAgent: { label: 'סוכן הניתוב', icon: ActivityIcon },
};
```

Note: `visualizationAgent` is NOT in `agents/mastra.ts` so it's excluded. `Record<AgentName, ...>` enforces completeness at compile time.

- [x] 2.2 Done

---

### 2.3 Extend `getToolDataSource` for agent-as-tool keys

In `constants/tool-data-sources.ts`, add agent-to-datasource resolution:

```typescript
import { AgentsDisplayMap } from './agents-display';

// Add to getToolDataSource function:
export function getToolDataSource(toolKey: string): DataSource | undefined {
    if (CBS_TOOL_NAMES.has(toolKey)) return 'cbs';
    if (DATAGOV_TOOL_NAMES.has(toolKey)) return 'datagov';

    // Agent-as-tool: extract agent name and look up dataSource from AgentsDisplayMap
    if (toolKey.startsWith('agent-')) {
        const agentName = toolKey.slice('agent-'.length);
        const agentInfo = AgentsDisplayMap[agentName as keyof typeof AgentsDisplayMap];
        return agentInfo?.dataSource;
    }

    return undefined;
}
```

This makes `getToolDataSourceConfig('agent-cbsAgent')` return the CBS badge config, and `getToolDataSourceConfig('agent-datagovAgent')` return the DataGov badge config. `ToolCallStep.tsx` already calls `getToolDataSourceConfig(step.toolKey)` — no changes needed there.

- [x] 2.3 Done

---

## 3. Frontend: Agent Delegation Visualization

### 3.1 Add agent-as-tool entries to `toolIconMap` and `toolTranslations`

In `components/chat/MessageToolCalls.tsx`, add to `toolIconMap`:
```typescript
import { AgentsDisplayMap } from '@/constants/agents-display';

const toolIconMap: Partial<Record<ToolName, LucideIcon>> = {
    // ... existing entries ...
    'agent-datagovAgent': AgentsDisplayMap.datagovAgent.icon,
    'agent-cbsAgent': AgentsDisplayMap.cbsAgent.icon,
};
```

In `constants/tool-translations.tsx`, add entries:
```typescript
import { AgentsDisplayMap } from './agents-display';

// Add to toolTranslations object:
'agent-datagovAgent': {
    name: AgentsDisplayMap.datagovAgent.label,
    icon: <AgentsDisplayMap.datagovAgent.icon className='h-4 w-4' />,
    formatInput: (input) => {
        if (input.prompt) return input.prompt;
        return undefined;
    },
    formatOutput: (output) => {
        if (output.text) return output.text;
        return 'הושלם';
    },
},
'agent-cbsAgent': {
    name: AgentsDisplayMap.cbsAgent.label,
    icon: <AgentsDisplayMap.cbsAgent.icon className='h-4 w-4' />,
    formatInput: (input) => {
        if (input.prompt) return input.prompt;
        return undefined;
    },
    formatOutput: (output) => {
        if (output.text) return output.text;
        return 'הושלם';
    },
},
```

- [x] 3.1 Done

---

### 3.2 Clean up `MessageItem.tsx` — remove network-group handling

In `components/chat/MessageItem.tsx`:

1. Remove `network-group` from `RenderSegment` type:
```typescript
// REMOVE this variant from the union:
// | { kind: 'network-group'; networkParts: NetworkDataPart[] }
```

2. Remove `isAgentsNetworkDataPart` check from `segmentMessageParts` (lines 86-96):
```typescript
// REMOVE this block:
// if (isAgentsNetworkDataPart(part)) { ... }
```

3. Remove the `network-group` case from the render switch (lines 253-279):
```typescript
// REMOVE:
// if (segment.kind === 'network-group') { ... }
```

4. Remove the network data part check from `showLoadingShimmer` (lines 218-221):
```typescript
// REMOVE:
// if (isAgentsNetworkDataPart(lastPart)) { ... }
```

5. Remove unused imports:
```typescript
// REMOVE:
import { AgentsNetworkDataParts } from './AgentsNetworkDataParts';
import { isAgentsNetworkDataPart } from './types';
import type { NetworkDataPart } from '@mastra/ai-sdk';
```

6. Remove `extractChartsFromNetworkParts` function (lines 47-68) — dead code.

- [x] 3.2 Done

---

### 3.3 Remove network-related types from `components/chat/types.ts`

Remove types only used by the network rendering path:
- `NetworkToolCall` interface
- `NetworkStepWithTask` interface
- `isAgentsNetworkDataPart()` type guard
- Any imports from `@mastra/ai-sdk` for `NetworkDataPart`

Keep all tool-related types (`ToolCallPart`, `getToolStatus`, `isToolPart`, etc.) — still needed.

- [x] 3.3 Done

---

### 3.4 Remove unused network components

Delete or mark as dead code:
- `components/chat/AgentsNetworkDataParts.tsx`
- `components/chat/AgentNetworkDataStep.tsx` (display map moved to constants)

These components rendered `data-network` parts from `handleNetworkStream`. With `handleChatStream`, agent calls appear as standard tool parts and flow through `ToolCallParts.tsx` / `ToolCallStep.tsx`.

- [x] 3.4 Done

---

## 4. Verification

- [ ] 4.1 Run `tsc` — no type errors
- [ ] 4.2 Run `npm run build` — production build succeeds
- [ ] 4.3 Run `npm run eslint` — no new linting issues
- [ ] 4.4 Manual browser testing:
  - Start fresh thread (new UUID) — verify `generateTitle` produces a title
  - DataGov query (e.g., "חפש מאגרי מידע על חינוך") — verify `agent-datagovAgent` tool call renders with DatabaseIcon + Hebrew label + "מידע ממשלתי" data-source badge + summary
  - CBS query (e.g., "מה מדד המחירים לצרכן?") — verify `agent-cbsAgent` tool call renders with BarChart2Icon + Hebrew label + "למ"ס" data-source badge + summary
  - Mixed query — verify both agent tools appear in tool timeline with correct badges
  - Verify `onFinish` fires (check server console for `[onFinish] totalUsage:` log)
  - Verify `suggestFollowUps` appears in every response (stop condition works)
  - Verify charts still render correctly
  - Verify source URLs appear after message completes
