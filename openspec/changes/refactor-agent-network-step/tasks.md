## 1. Implementation

- [x] 1.1 Create `components/chat/AgentNetworkDataStep.tsx` component
  - Accepts a grouped step entry: `{ name: AgentName, status: 'failed' | 'other', count: number, isActive: boolean }`
  - Renders a `ChainOfThoughtStep` with the agent icon/label from `AgentsDisplayMap`
  - Shows a counter badge (e.g., `×3`) when count > 1
  - Shows shimmer animation when `isActive` is true
  - Failed steps render with `text-red-500` styling
  - No input/output `Reasoning` sections

- [x] 1.2 Add grouping logic to `AgentsNetworkMessages.tsx`
  - Flatten all `steps` from all `parts` into a single list
  - Filter out steps where `step.name === 'routing-agent'`
  - Group by composite key: `${step.name}:${step.status === 'failed' ? 'failed' : 'other'}`
  - Each group tracks: `name`, `status` bucket, `count`, and whether any instance is `running`
  - Pass grouped entries to `AgentNetworkDataStep`

- [x] 1.3 Update `AgentsNetworkDataParts` to use grouped steps
  - Replace the current nested `parts.map → data.steps.map` with grouped step rendering
  - Remove `Reasoning`/`ReasoningContent`/`ReasoningTrigger` imports (no longer needed)
  - Remove unused `isProcessing` prop from interface and caller
  - Keep ChainOfThought wrapper, header shimmer, and open/close state as-is

- [x] 1.4 Run verification
  - `tsc` — no new type errors (3 pre-existing errors in unrelated files)
  - `npm run build` — pre-existing build error in `ToolCallCard.tsx` (unrelated)
  - `npm run lint` — clean, no warnings
  - Timeline line fix: added `min-h-10` to steps so connecting lines are visible without description content
