# Change: Extract AgentNetworkDataStep with grouped step rendering

## Why

The `AgentsNetworkDataParts` component currently renders each step individually with input/output reasoning sections. This makes the timeline noisy when the same agent runs multiple times. Extracting an `AgentNetworkDataStep` component that groups steps by `step.name` and status (failed vs non-failed), shows a count badge, and removes input/output rendering will produce a cleaner, more scannable agent timeline. Additionally, the `routing-agent` step should be filtered out as it's an internal routing detail not useful to the user.

## What Changes

- Extract a new `AgentNetworkDataStep` component from `AgentsNetworkMessages.tsx`
- Group all steps across all `NetworkDataPart`s by `step.name` + status bucket (failed / non-failed)
- Display a counter badge showing how many times that agent step occurred
- Remove the input/output `Reasoning` rendering from step display
- Filter out steps with `step.name === 'routing-agent'`
- Keep the `ChainOfThought` wrapper, header with shimmer, and open/close logic in the parent

## Impact

- Affected specs: `chat-ui`
- Affected code:
  - `components/chat/AgentsNetworkMessages.tsx` — refactor to use new sub-component
  - `components/chat/AgentNetworkDataStep.tsx` — new file for grouped step rendering
