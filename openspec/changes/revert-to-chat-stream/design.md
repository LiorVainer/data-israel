## Context

After migrating to `handleNetworkStream` (`activate-agent-network-delegation`), we discovered that Mastra's `agent.network()` execution path does not support `onFinish`, `toolCallConcurrency`, or `stopWhen` — these are `AgentExecutionOptions` fields that only work with `agent.stream()` (used by `handleChatStream`). This is a fundamental architectural limitation: `network()` uses a workflow-based loop (`networkLoop`) that only accepts `NetworkOptions`.

The routing agent already has `agents: { datagovAgent, cbsAgent }`. When using `handleChatStream` → `.stream()`, Mastra automatically converts sub-agents into callable tools named `agent-{agentName}`. This means delegation still works — the routing agent can call `agent-datagovAgent` and `agent-cbsAgent` as tools.

## Goals / Non-Goals

- **Goals:**
  - Restore `onFinish` callback for Convex token tracking
  - Restore `stopWhen` for `suggestFollowUps` enforcement (replacing `SuggestFollowUpsProcessor`)
  - Restore `toolCallConcurrency` control
  - Keep sub-agent delegation (routing agent → CBS/DataGov agents)
  - Visualize agent delegation in the UI with icons, Hebrew labels, data-source badge, and result summary
  - Remove the complex `ensureStreamCompleteness` wrapper
  - Remove all network-era backward-compatibility code
  - Make `AgentsDisplayMap` type-safe with keys derived from `agents` const
  - Make `ToolIOMap` auto-derived from actual tool objects (zero manual maintenance)

- **Non-Goals:**
  - Showing individual tool calls *inside* each sub-agent (not available in `handleChatStream` — sub-agent execution is encapsulated)
  - Changing agent definitions or instructions
  - Modifying tool implementations
  - Backward compatibility with threads created during `handleNetworkStream` era

## Decisions

### Decision 1: Revert API route to `handleChatStream`

**What**: Replace `handleNetworkStream` with `handleChatStream` in `app/api/chat/route.ts`, restoring the original `stopWhen`, `onFinish`, `sendReasoning`, `sendSources` options. Remove all network-era code including `ensureStreamCompleteness`, `sanitizeRecalledMessages`, `processNetworkTextPart`.

**Why**: This is the only way to get `onFinish` and `stopWhen` working with Mastra's current architecture. The `handleChatStream` → `agentObj.stream()` path supports the full `AgentExecutionOptions` interface.

**Alternatives considered**:
- Keep `handleNetworkStream` + use `onIterationComplete`: Only fires per-iteration, doesn't provide aggregated `totalUsage`, doesn't support `stopWhen`
- Patch Mastra source: Fragile, not maintainable
- Extract usage from stream chunks: Complex, unreliable, still no `stopWhen`

### Decision 2: Remove `SuggestFollowUpsProcessor`

**What**: Remove `outputProcessors: [new SuggestFollowUpsProcessor()]` from the routing agent and delete the processor file.

**Why**: With `stopWhen` enforcing `suggestFollowUps`, the processor is completely redundant. The `stopWhen` condition is the proper mechanism — it keeps the stream running until `suggestFollowUps` is called, with `MAX_STEPS` as a safety fallback. The processor was a workaround for the network path not supporting `stopWhen`.

### Decision 3: No backward compatibility for network-era threads

**What**: Remove `sanitizeRecalledMessages`, `processNetworkTextPart`, and all `{ isNetwork: true }` metadata handling. The GET handler loads messages as-is.

**Why**: The `handleNetworkStream` era was short-lived. No need to maintain complex sanitization for a few threads. If old threads have garbled display, users can start new ones.

### Decision 4: Detect agent-as-tool calls with data-source badges

**What**: In the tool grouping logic, detect tool keys starting with `agent-` and use the `AgentsDisplayMap` for icon and Hebrew label. Show the appropriate data-source badge next to agent delegation entries: `agent-cbsAgent` → CBS badge, `agent-datagovAgent` → DataGov badge.

**Why**: Each sub-agent corresponds to a specific data source. Showing the badge makes it immediately clear which data source the agent is querying — same UX pattern as individual tool calls.

**Implementation**: Add an optional `dataSource` field to `AgentsDisplayMap` entries. Extend `getToolDataSource` in `constants/tool-data-sources.ts` to check for `agent-*` prefix and resolve via the display map.

**Rendering**: For `agent-*` tools, `ToolCallStep` will show:
- Agent icon (from `AgentsDisplayMap`) instead of generic tool icon
- Agent Hebrew label (e.g., "בודק במאגרי המידע הממשלתי") instead of tool name
- Data-source badge (למ"ס for CBS, מידע ממשלתי for DataGov) — via `getToolDataSourceConfig`
- The agent's text output as the description (summary of what it did)

### Decision 5: Type-safe `AgentsDisplayMap` with derived keys

**What**: Create `constants/agents-display.ts` with `Record<AgentName, { label: string; icon: LucideIcon; dataSource?: DataSource }>` where `AgentName = keyof typeof agents`.

**Why**: Ensures compile-time enforcement — if an agent is added to or removed from `agents/mastra.ts`, TypeScript forces updating the display map. The `dataSource` field enables the data-source badge on agent delegation steps.

**Pattern**:
```typescript
import type { AgentName } from '@/agents/types';
import type { DataSource } from '@/constants/tool-data-sources';

export interface AgentDisplayInfo {
    label: string;
    icon: LucideIcon;
    dataSource?: DataSource;
}

export const AgentsDisplayMap: Record<AgentName, AgentDisplayInfo> = {
    datagovAgent: { label: 'בודק במאגרי המידע הממשלתי', icon: DatabaseIcon, dataSource: 'datagov' },
    cbsAgent: { label: 'בודק בנתוני הלשכה המרכזית לסטטיסטיקה', icon: BarChart2Icon, dataSource: 'cbs' },
    routingAgent: { label: 'סוכן הניתוב', icon: ActivityIcon },
};
```

### Decision 6: Type-safe `ToolIOMap` derived from tool objects

**What**: Replace the manual `interface ToolIOMap` (28+ entries, 130+ lines) with a mapped type using AI SDK's `InferToolInput` / `InferToolOutput`.

**Why**: Eliminates manual synchronization. The current manual interface already has bugs (agent entries use `SearchCbsLocalitiesOutput` as placeholder output — clearly wrong). The derived approach is always correct.

**Pattern**:
```typescript
import type { InferToolInput, InferToolOutput } from 'ai';

type AllToolObjects = typeof ClientTools & typeof DataGovTools & typeof CbsTools;

type DerivedToolIOMap = {
    [K in keyof AllToolObjects]: {
        input: InferToolInput<AllToolObjects[K]>;
        output: InferToolOutput<AllToolObjects[K]>;
    };
};

type NetworkAgentInput = { prompt: string };
type NetworkAgentOutput = { text: string };

type AgentToolIOMap = {
    [K in `agent-${Extract<keyof typeof agents, string>}`]: {
        input: NetworkAgentInput;
        output: NetworkAgentOutput;
    };
};

export type ToolIOMap = DerivedToolIOMap & AgentToolIOMap;
```

**No breaking changes**: `ToolName`, `ToolInput<T>`, `ToolOutput<T>` retain the same structural shape. All consumers (`ToolTranslationsMap`, `toolIconMap`, `ToolCallCard`, etc.) continue to work without modification.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Sub-agent internal tool calls no longer visible | Acceptable — the agent's text output summarizes what it did. The ToolResultSummarizer processors on CBS/DataGov agents produce concise Hebrew summaries. |
| Network-era threads display garbled | Acceptable — short-lived era, users can start new threads. |
| `agent-*` tool keys not in `toolTranslations` | Add entries to `toolTranslations` for `agent-datagovAgent` and `agent-cbsAgent` with Hebrew names and formatInput/formatOutput. |
| `InferToolInput`/`InferToolOutput` not available in current AI SDK | Verified available in AI SDK v6 (re-exported from `@ai-sdk/provider-utils`). Already used implicitly by `InferUITools` in `agents/types.ts`. |

## Open Questions

- None — approach is clear from source code analysis, git diff review, and AI SDK type analysis.
