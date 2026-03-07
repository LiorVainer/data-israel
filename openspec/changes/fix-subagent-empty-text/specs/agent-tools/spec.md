## ADDED Requirements

### Requirement: Sub-Agent Text Output Guarantee
The system SHALL ensure sub-agents produce non-empty text responses via an `EnsureTextOutputProcessor` registered on each sub-agent's `inputProcessors`.

#### Scenario: Sub-agent exhausts tool-call steps without text
- **WHEN** a sub-agent has completed 8+ agentic loop steps with tool calls
- **AND** no step has produced text output
- **THEN** the processor SHALL set `toolChoice: 'none'` on the next step
- **AND** inject a system message instructing the sub-agent to write a Hebrew text summary

#### Scenario: Sub-agent produces text before threshold
- **WHEN** a sub-agent produces text output before reaching the step threshold
- **THEN** the processor SHALL NOT interfere with tool choice

#### Scenario: Sub-agent has no tool calls
- **WHEN** a sub-agent's first step has no previous tool calls
- **THEN** the processor SHALL NOT interfere (allow normal first-step behavior)

### Requirement: Delegation Hooks for Sub-Agent Control
The system SHALL configure delegation hooks on the routing agent's stream execution to control sub-agent behavior.

#### Scenario: Sub-agent step budget
- **WHEN** the routing agent delegates to a sub-agent
- **THEN** `onDelegationStart` SHALL set `modifiedMaxSteps` to 15

#### Scenario: Empty text feedback
- **WHEN** a sub-agent delegation completes successfully with empty text
- **THEN** `onDelegationComplete` SHALL inject feedback telling the routing agent to interpret tool results directly

### Requirement: Incremental Delegation Strategy
The routing agent instructions SHALL direct it to delegate smaller, focused tasks to sub-agents rather than entire user questions.

#### Scenario: Complex data query
- **WHEN** a user asks a multi-step question (e.g., "find train accuracy and worst stations")
- **THEN** the routing agent SHALL break it into focused delegations (e.g., "search for train datasets" then "query dataset X for accuracy data")

#### Scenario: Simple query
- **WHEN** a user asks a straightforward question answerable in one delegation
- **THEN** the routing agent MAY delegate in a single call
