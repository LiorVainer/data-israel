# Chat UI - API URL Display

## ADDED Requirements

### Requirement: Tool Call URL Display
The system SHALL display API URLs fetched by tools in the chain-of-thought timeline.

#### Scenario: Display URL for completed tool call
- **WHEN** a tool call completes successfully
- **AND** the tool output contains an `apiUrl` field
- **THEN** the URL SHALL be displayed as a badge using `ChainOfThoughtSearchResults`
- **AND** if `searchedResourceName` is present, the badge SHALL show the Hebrew resource name
- **AND** if `searchedResourceName` is absent, the badge SHALL show only the URL pathname
- **AND** the badge SHALL be clickable to open the full URL in a new tab

#### Scenario: Display URL for failed tool call
- **WHEN** a tool call fails with an error
- **AND** the tool output contains an `apiUrl` field
- **THEN** the attempted URL SHALL still be displayed
- **AND** this helps users debug which endpoint failed

#### Scenario: Multiple URLs in grouped tool calls
- **WHEN** multiple tool calls of the same type are grouped
- **AND** each call has a different `apiUrl`
- **THEN** all unique URLs SHALL be displayed in the group
- **AND** duplicate URLs SHALL be deduplicated

#### Scenario: No URL available
- **WHEN** a tool call completes
- **AND** the tool output does not contain an `apiUrl` field
- **THEN** no URL badge SHALL be displayed
- **AND** this is expected for tools that use internal sources (e.g., Convex RAG)

### Requirement: URL Badge Styling
The URL badges SHALL be styled consistently with the chain-of-thought design system.

#### Scenario: URL badge appearance
- **WHEN** a URL badge is rendered
- **THEN** it SHALL use the `ChainOfThoughtSearchResult` component
- **AND** it SHALL have a secondary variant style
- **AND** it SHALL display an external link icon (optional)

#### Scenario: URL badge interaction
- **WHEN** a user clicks on a URL badge
- **THEN** the full URL SHALL open in a new browser tab
- **AND** the link SHALL use `rel="noopener noreferrer"` for security

#### Scenario: URL truncation
- **WHEN** a URL pathname is longer than the available space
- **THEN** it SHALL be truncated with ellipsis
- **AND** the full URL SHALL be visible on hover via title attribute

## MODIFIED Requirements

### Requirement: Tool Call Grouping
Tool calls in a message SHALL be grouped by tool name and status for compact display. Groups SHALL now include collected API URLs.

#### Scenario: Group includes resources
- **WHEN** tool calls are grouped by tool name
- **THEN** the `GroupedToolCall` interface SHALL include a `resources` array
- **AND** each resource SHALL have `url: string` and optional `name?: string`
- **AND** resources SHALL be collected from each tool's output during grouping
- **AND** duplicate URLs SHALL be deduplicated within a group

#### Scenario: Resource extraction from output
- **WHEN** grouping tool calls
- **THEN** the grouping logic SHALL extract `apiUrl` and `searchedResourceName` from `part.output`
- **AND** only entries with valid `apiUrl` string SHALL be collected
- **AND** `searchedResourceName` SHALL be included as `name` when present

### Requirement: Tool Call Step Rendering
Each grouped tool call step SHALL render tool information in the chain-of-thought timeline. Steps SHALL now include URL display.

#### Scenario: Step with URLs
- **WHEN** rendering a `ToolCallStep` component
- **AND** the step has `apiUrls` with one or more URLs
- **THEN** the URLs SHALL be rendered below the step label/description
- **AND** the URLs SHALL be wrapped in `ChainOfThoughtSearchResults`

#### Scenario: Step without URLs
- **WHEN** rendering a `ToolCallStep` component
- **AND** the step has no `apiUrls` or an empty array
- **THEN** no URL section SHALL be rendered
- **AND** the step SHALL display normally without extra whitespace
