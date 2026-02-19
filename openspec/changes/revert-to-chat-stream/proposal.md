# Change: Revert to handleChatStream with Agent Delegation Visualization

## Why

After migrating to `handleNetworkStream` (change: `activate-agent-network-delegation`), several critical features stopped working:

1. **`onFinish` callback never fires** — The `NetworkOptions` type used by `agent.network()` does not include `onFinish`. Token usage tracking via Convex is completely broken.
2. **`toolCallConcurrency` silently ignored** — Same root cause; `NetworkOptions` doesn't support it.
3. **`generateTitle` unreliable** — Only fires on the very first user message in a thread; no per-conversation title generation.
4. **`stopRunWhen` unavailable** — Cannot enforce `suggestFollowUps` as a stop condition, leading to inconsistent stream completions and the need for the complex `ensureStreamCompleteness` wrapper.

These are architectural limitations of Mastra's `agent.network()` path (confirmed via source code analysis of `@mastra/core@1.1.0`). The `network()` method uses a workflow-based execution loop that does not plumb `AgentExecutionOptions` fields like `onFinish`, `toolCallConcurrency`, or `stopWhen` through to the underlying agent execution.

## What Changes

### 1. API Route: Revert to `handleChatStream` (Backend)

- **`app/api/chat/route.ts`**: Replace `handleNetworkStream` with `handleChatStream`. Restore `onFinish` callback for Convex token tracking. Add `stopWhen` for `suggestFollowUps` tool. Remove the `ensureStreamCompleteness` wrapper and all network-era sanitization code (`sanitizeRecalledMessages`, `processNetworkTextPart`). No backward compatibility with network-era threads.

### 2. Routing Agent: Remove `SuggestFollowUpsProcessor` (Backend)

- **`agents/network/routing/routing.agent.ts`**: Remove `outputProcessors: [new SuggestFollowUpsProcessor()]`. With `stopWhen` enforcing `suggestFollowUps`, the processor is redundant.
- **`agents/processors/suggest-follow-ups.processor.ts`**: Delete this file.

### 3. Agent Delegation Visualization with Data-Source Badges (Frontend)

With `handleChatStream`, sub-agent calls appear as standard tool parts (`tool-agent-datagovAgent`, `tool-agent-cbsAgent`) instead of `data-network` parts.

**Approach**: Enhance `ToolCallParts.tsx` / `ToolCallStep.tsx` to detect `agent-*` tool calls and render them with agent-specific icons, Hebrew labels, **data-source badges** (למ"ס for CBS, מידע ממשלתי for DataGov), and a summary of what the agent did.

Specifically:
- Add agent entries to `toolTranslations` and `toolIconMap`
- Extend `getToolDataSource` to resolve `agent-*` keys to their data source via `AgentsDisplayMap`
- `ToolCallStep.tsx` already renders data-source badges via `getToolDataSourceConfig` — no changes needed there

### 4. Type-Safe `AgentsDisplayMap` (Frontend)

- Create `constants/agents-display.ts` with `AgentsDisplayMap` typed as `Record<AgentName, AgentDisplayInfo>` where `AgentName = keyof typeof agents`
- Each entry includes `label`, `icon`, and optional `dataSource` field
- Remove `visualizationAgent` entry (not in `agents` const)

### 5. Type-Safe `ToolIOMap` (Shared Types)

- Replace the manual 28-entry `interface ToolIOMap` in `lib/tools/types.ts` with a mapped type derived from actual tool objects using AI SDK's `InferToolInput` / `InferToolOutput` utility types
- Agent-as-tool entries derived from `agents` const via template literal keys
- Zero manual maintenance — adding/removing a tool automatically updates `ToolIOMap`

## Impact

- Affected code:
  - `app/api/chat/route.ts` — revert to `handleChatStream`, remove all network-era code
  - `agents/network/routing/routing.agent.ts` — remove `outputProcessors`
  - `agents/processors/suggest-follow-ups.processor.ts` — **DELETE**
  - `lib/tools/types.ts` — replace manual `ToolIOMap` with derived mapped type
  - `constants/agents-display.ts` — **NEW**: type-safe `AgentsDisplayMap` with `dataSource`
  - `constants/tool-data-sources.ts` — extend `getToolDataSource` for `agent-*` keys
  - `constants/tool-translations.tsx` — add `agent-*` entries
  - `components/chat/MessageToolCalls.tsx` — add agent-* entries to `toolIconMap`
  - `components/chat/MessageItem.tsx` — remove `network-group` segment handling
  - `components/chat/types.ts` — remove network-related types
  - `components/chat/AgentsNetworkDataParts.tsx` — **DELETE** (unused)
  - `components/chat/AgentNetworkDataStep.tsx` — **DELETE** (display map moved to constants)
- **UNCHANGED**: `agents/network/datagov/**`, `agents/network/cbs/**`, `lib/tools/**` (tool implementations), `components/chat/ToolCallStep.tsx` (already renders data-source badges)
