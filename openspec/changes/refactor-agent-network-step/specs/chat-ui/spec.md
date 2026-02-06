## ADDED Requirements

### Requirement: Grouped Agent Network Step Display
The `AgentNetworkDataStep` component SHALL render a single grouped agent step within the chain-of-thought timeline. Steps across all network data parts SHALL be grouped by `step.name` and status bucket (failed vs non-failed). Each grouped step SHALL display a counter badge showing the occurrence count when greater than 1. The component SHALL NOT render input or output reasoning sections. Steps with `step.name` equal to `routing-agent` SHALL be filtered out and not displayed.

#### Scenario: Multiple successful steps from the same agent
- **WHEN** the network data contains 3 steps with `name: 'cbsAgent'` and `status: 'success'`
- **THEN** a single `AgentNetworkDataStep` is rendered with the CBS agent icon, label, and a `×3` counter badge

#### Scenario: Mixed failed and successful steps from the same agent
- **WHEN** the network data contains 2 steps with `name: 'datagovAgent'` where 1 has `status: 'success'` and 1 has `status: 'failed'`
- **THEN** two separate `AgentNetworkDataStep` entries are rendered: one for the successful step (count 1, no badge) and one for the failed step (count 1, red styling)

#### Scenario: Routing agent steps are hidden
- **WHEN** the network data contains steps with `name: 'routing-agent'`
- **THEN** those steps are not rendered in the timeline

#### Scenario: Active step shows shimmer
- **WHEN** a grouped step contains at least one instance with `status: 'running'`
- **THEN** the step renders with a shimmer animation indicating activity

#### Scenario: Single occurrence has no counter badge
- **WHEN** only one step exists for a given agent name and status bucket
- **THEN** no counter badge is displayed
