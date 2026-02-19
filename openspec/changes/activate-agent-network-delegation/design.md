## Context

The `migrate-to-mastra-network` change scaffolded the agent files and switched to `handleChatStream`, but left the architecture flat: routing agent holds all tools, sub-agents are defined but not connected. This change completes the wiring and switches to `handleNetworkStream` for richer streaming data.

**Stakeholders**: API route, routing agent, sub-agents, message rendering pipeline.

## Goals / Non-Goals

- **Goals**:
  - Wire `cbsAgent` and `datagovAgent` as actual sub-agents on the routing agent via the `agents` property
  - Move domain tools (CBS, DataGov) off the routing agent — it keeps only `ClientTools`
  - Switch API route to `handleNetworkStream` for `data-network` part streaming
  - Refactor `AgentsNetworkDataParts` and `AgentNetworkDataStep` to match `ToolCallParts` / `ToolCallStep` design language
  - Integrate network data parts into `MessageItem` rendering pipeline

- **Non-Goals**:
  - Changing tool definitions or adding new tools
  - Modifying the visualization agent (already deprecated)
  - Changing the memory/storage architecture (stays Convex-based)
  - Model selection changes

## Decisions

### 1. `handleNetworkStream` over `handleChatStream`

- **Decision**: Switch to `handleNetworkStream` from `@mastra/ai-sdk`
- **Why**: `handleNetworkStream` emits `data-network` parts in the UI message stream containing per-agent step metadata (name, status, usage, input/output). This is what enables the `AgentsNetworkDataParts` component to actually render. `handleChatStream` only emits tool call parts — no agent delegation visibility.
- **API compatibility**: Identical signature to `handleChatStream` (same `mastra`, `agentId`, `params`, `defaultOptions`). Drop-in replacement.
- **Frontend compatibility**: `useChat` + `DefaultChatTransport` works unchanged. The `data-network` parts appear as additional message parts alongside tool/text parts.

### 2. Tool Distribution

- **Routing agent keeps**: `ClientTools` only (suggestFollowUps, displayBarChart, displayLineChart, displayPieChart, generateDataGovSourceUrl, generateCbsSourceUrl)
- **Routing agent delegates via**: `agents: { datagovAgent, cbsAgent }`
- **DataGov agent has**: All 16 DataGov tools (via `DataGovTools` spread)
- **CBS agent has**: All 9 CBS tools (via `CbsTools` spread)
- **Why**: The routing agent still needs client tools (charts render client-side, suggestions/source URLs are cross-domain). Domain-specific data tools move to their specialized agents where instructions are tailored.

### 3. Sub-Agent Simplification

- **Decision**: Remove `outputProcessors` and explicit `memory` from sub-agents
- **Why**: In a Mastra agent network, the routing agent manages memory. Sub-agents inherit instance-level storage from the Mastra instance automatically. The `ToolResultSummarizerProcessor` is unnecessary because the routing agent synthesizes the final response from sub-agent outputs.

### 4. Network Data Part Rendering Strategy

- **Decision**: Render `data-network` parts in `MessageItem` as a separate segment type (similar to `tool-group`)
- **Why**: Network data parts are emitted alongside tool parts and text. They should appear in chronological order within the message, using the same `ChainOfThought` accordion pattern.
- **Design language alignment**: Use the same patterns as `ToolCallParts`:
  - Rotating Hebrew processing labels with shimmer
  - Grouped steps with count/status badges
  - Data source badges linking to CBS/data.gov.il
  - Open/close toggle with auto-open during processing
  - Stats-based header (completed count, error count)

### 5. Type Safety for Network Step Tool Calls

- **Decision**: Define local extended types (`NetworkStepWithTask`, `NetworkToolCall`) + a `hasTaskData` type guard
- **Why**: Mastra's exported `NetworkDataPart.data.steps` is typed as `StepResult[]` (minimal: name, status, input, output). But at runtime, `transformNetwork()` extends each step with `id`, `iteration`, and `task` (containing `LLMStepResult` with `toolCalls`/`toolResults`). These survive JSON serialization but aren't in the public type.
- **Approach**: Instead of `as` casts, define an interface `NetworkStepWithTask` with the runtime fields and use a `hasTaskData()` type guard to narrow safely. This aligns with the project's no-`as`/no-`any` rule.
- **Source**: `node_modules/@mastra/ai-sdk/dist/transformers.d.ts` lines 249-255 show the runtime shape in the `transformNetwork()` signature's `bufferedNetworks` parameter type.

### 6. Per-Agent Tool Call Display

- **Decision**: Each agent step in the network accordion shows its individual tool calls nested underneath
- **Why**: The user wants visibility into not just which agents ran, but what each agent did with its tools
- **Data flow**: `NetworkDataPart.data.steps[n].task.toolCalls` → extract `toolName` → use existing `getToolInfo()` from `MessageToolCalls.tsx` for icons/labels → render as `ChainOfThoughtSearchResults` children
- **Fallback**: If `task` is null (step still running, or data unavailable), show agent-level info only without nested tools

### 7. `stopWhen` Compatibility

- **Decision**: Keep the existing `hasCompletedWithSuggestions` stop condition
- **Why**: `handleNetworkStream` accepts the same `defaultOptions` as `handleChatStream`, including `stopWhen`. The stop condition checks for `suggestFollowUps` tool call which remains on the routing agent. No changes needed.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| `handleNetworkStream` may not support all `handleChatStream` options | Low | Context7 docs confirm identical parameter structure |
| Sub-agents may lose memory context without explicit Memory config | Low | Mastra instance-level storage is inherited; routing agent manages conversation memory |
| Network data parts may not contain tool-level detail (only agent-level) | Medium | Tool call parts still stream separately; network parts add agent delegation visibility as a bonus layer |
| Source URL tools may not work if routing agent can't see data tool outputs | Medium | Source URL tools stay on routing agent; they generate URLs from parameters, not from data tool outputs directly |
| `ToolResultSummarizerProcessor` removal may affect response quality | Low | Routing agent already writes its own Hebrew summaries; processor was a fallback for when sub-agents didn't produce text |

## Open Questions

- Should `generateDataGovSourceUrl` and `generateCbsSourceUrl` move to their respective sub-agents instead of staying on the routing agent? (Deferred — keep on routing agent for now since they're cross-cutting)
