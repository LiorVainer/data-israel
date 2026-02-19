# Change: Activate Agent Network Delegation

## Why

The codebase already has `cbsAgent` and `datagovAgent` defined (`agents/network/cbs/cbs.agent.ts`, `agents/network/datagov/data-gov.agent.ts`) but they are **not wired into the routing agent or the Mastra instance**. The routing agent currently holds ALL tools directly and calls them itself (flat single-agent architecture). This means:

1. The routing agent must reason over 26+ tools simultaneously, degrading routing accuracy.
2. The `AgentsNetworkDataParts` component (network step visualization) never renders because `handleChatStream` doesn't emit `data-network` parts.
3. Sub-agent-specific instructions (CBS/DataGov) are unused since there is no actual delegation.

## What Changes

### 1. Agent Network Wiring (Backend)

- **Routing agent** (`agents/network/routing/routing.agent.ts`): Add `agents: { datagovAgent, cbsAgent }` property. Remove `CbsTools` and `DataGovTools` from the `tools` spread (keep only `ClientTools` — charts, suggestions, source URLs).
- **CBS agent** (`agents/network/cbs/cbs.agent.ts`): Remove `outputProcessors` and `memory` (the routing agent handles memory; sub-agents inherit from Mastra instance).
- **DataGov agent** (`agents/network/datagov/data-gov.agent.ts`): Same — remove `outputProcessors` and `memory`.
- **Mastra instance** (`agents/mastra.ts`): Register `cbsAgent` and `datagovAgent` alongside `routingAgent`.

### 2. API Route: `handleNetworkStream` (Backend)

- **`app/api/chat/route.ts`**: Replace `handleChatStream` with `handleNetworkStream` from `@mastra/ai-sdk`. The signature is identical — same `mastra`, `agentId`, `params`, `defaultOptions` pattern. This enables `data-network` parts in the stream containing agent step metadata (which agent ran, status, usage).

### 3. UI: Network Data Parts Rendering (Frontend)

- **`AgentsNetworkDataParts.tsx`**: Refactor to match the design language and functionality of `ToolCallParts.tsx` / `ToolCallStep.tsx` — grouped steps with progress tracking, processing labels, open/close state, Hebrew status text. Remove the current simplified implementation.
- **`AgentNetworkDataStep.tsx`**: Refactor to match `ToolCallStep.tsx` pattern — consistent status descriptions, data source badges, resource display via `ChainOfThoughtSearchResults`.
- **`MessageItem.tsx`**: Add rendering of `data-network` parts from the message stream, integrating with the existing segment-based rendering pipeline.

## Impact

- Affected specs: `agent-orchestration` (from `migrate-to-mastra-network`)
- Affected code:
  - `agents/network/routing/routing.agent.ts` — add `agents`, remove domain tools
  - `agents/network/cbs/cbs.agent.ts` — simplify (remove processors/memory)
  - `agents/network/datagov/data-gov.agent.ts` — simplify (remove processors/memory)
  - `agents/mastra.ts` — register sub-agents
  - `app/api/chat/route.ts` — `handleNetworkStream` replaces `handleChatStream`
  - `components/chat/AgentsNetworkDataParts.tsx` — redesign
  - `components/chat/AgentNetworkDataStep.tsx` — redesign
  - `components/chat/MessageItem.tsx` — add network data rendering
- **UNCHANGED**: `lib/tools/**` (all tool definitions stay as-is)
