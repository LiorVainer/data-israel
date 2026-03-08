## MODIFIED Requirements

### Requirement: Follow-Up Suggestions Display

The chat UI SHALL extract follow-up suggestions from the `suggestFollowUps` tool part using the `input` field (not `output`), since the tool is a passthrough (`execute: input => ({ suggestions: input.suggestions })`). Suggestions SHALL only be displayed after the stream has finished, but SHALL accept both `input-available` and `output-available` states (not require `output-available`). This ensures suggestions render correctly after a resumed stream where the tool result event was never delivered.

#### Scenario: Suggestions rendered after stream ends with input-available
- **WHEN** the stream has finished (status is not streaming)
- **AND** the last assistant message contains a `suggestFollowUps` tool part with state `input-available`
- **AND** the tool input contains `{ suggestions: ["suggestion1", "suggestion2"] }`
- **THEN** the Suggestions component SHALL render those suggestions as clickable buttons
- **AND** SHALL NOT show a loading skeleton

#### Scenario: Suggestions hidden during streaming
- **WHEN** the stream is active
- **THEN** the Suggestions component SHALL NOT be displayed regardless of `suggestFollowUps` tool state

#### Scenario: Suggestions rendered after normal completion with output-available
- **WHEN** the stream has finished
- **AND** the `suggestFollowUps` tool part has state `output-available`
- **AND** the tool input contains suggestions
- **THEN** the Suggestions component SHALL render those suggestions as clickable buttons

#### Scenario: Loading skeleton shown when stream ends with input-streaming
- **WHEN** the stream has finished
- **AND** the `suggestFollowUps` tool part has state `input-streaming`
- **THEN** the Suggestions component SHALL show a loading skeleton
