# message-rendering Specification

## Purpose
Define how assistant message parts are rendered in the chat UI, ensuring chronological ordering that matches the AI SDK `parts` array.

## ADDED Requirements

### Requirement: Chronological Part Rendering
The `MessageItem` component SHALL render message parts in the same order as they appear in the `message.parts` array from the AI SDK.

#### Scenario: Mixed tool and text parts
- **GIVEN** a message with parts `[reasoning, tool-A, tool-B, text, tool-C, text]`
- **WHEN** the message is rendered
- **THEN** the parts SHALL appear in order: reasoning, tool-group(A,B), text, tool-group(C), text

#### Scenario: All tools followed by text
- **GIVEN** a message with parts `[tool-A, tool-B, tool-C, text]`
- **WHEN** the message is rendered
- **THEN** a single tool-group(A,B,C) SHALL appear first, followed by text

#### Scenario: Text only (no tools)
- **GIVEN** a message with parts `[reasoning, text]`
- **WHEN** the message is rendered
- **THEN** parts render in order with no tool-group segments

### Requirement: Consecutive Server Tool Grouping
Consecutive server-side tool parts (not client tools like charts) SHALL be grouped into a single `ToolCallParts` component.

#### Scenario: Adjacent tools form one group
- **GIVEN** parts `[tool-searchDatasets, tool-getDatasetDetails, text]`
- **WHEN** segmented for rendering
- **THEN** the two tool parts SHALL be in one `ToolCallParts` group

#### Scenario: Tools separated by text form separate groups
- **GIVEN** parts `[tool-A, text, tool-B]`
- **WHEN** segmented for rendering
- **THEN** tool-A SHALL be in group 1 and tool-B SHALL be in group 2
- **AND** each group renders as a separate `ToolCallParts` component

#### Scenario: Tools separated by reasoning form separate groups
- **GIVEN** parts `[tool-A, reasoning, tool-B]`
- **WHEN** segmented for rendering
- **THEN** tool-A and tool-B SHALL be in separate groups

### Requirement: No Cross-Group Tool Merging
The same tool name appearing in different consecutive groups SHALL NOT be merged into a single grouped display.

#### Scenario: Same tool in separate groups
- **GIVEN** parts `[tool-getCbsPriceData, text, tool-getCbsPriceData]`
- **WHEN** rendered
- **THEN** two separate `ToolCallParts` components SHALL render
- **AND** each shows `getCbsPriceData` with count 1

#### Scenario: Same tool in same group
- **GIVEN** parts `[tool-getCbsPriceData, tool-getCbsPriceData, text]`
- **WHEN** rendered
- **THEN** one `ToolCallParts` component SHALL render
- **AND** it shows `getCbsPriceData` with count 2

### Requirement: Processing State Scoped to Last Tool Group
The "processing" indicator SHALL only apply to the last tool group in the message, not to earlier completed groups.

#### Scenario: Multiple groups while streaming
- **GIVEN** parts `[tool-A(complete), text, tool-B(active)]` and `isStreaming=true`
- **WHEN** rendered
- **THEN** the first tool-group SHALL show as completed (no spinner)
- **AND** the second tool-group SHALL show as processing

#### Scenario: All groups complete
- **GIVEN** all tool groups have completed and `isStreaming=false`
- **WHEN** rendered
- **THEN** no tool-group SHALL show a processing indicator

## MODIFIED Requirements

### Requirement: Client Tool Inline Rendering (unchanged)
Client-side tools (charts) SHALL continue to render inline at their position in the parts array, not grouped with server-side tools.

#### Scenario: Chart between server tools
- **GIVEN** parts `[tool-searchDatasets, tool-displayBarChart, tool-getCbsPriceData]`
- **WHEN** rendered
- **THEN** order SHALL be: tool-group(searchDatasets), chart(bar), tool-group(getCbsPriceData)
- **AND** the chart renders as `ChartRenderer`, not inside `ToolCallParts`
