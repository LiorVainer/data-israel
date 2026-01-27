# client-tools Specification Delta

## ADDED Requirements

### Requirement: Display Chart Tools

The system SHALL provide three separate chart display tools: `displayBarChart`, `displayLineChart`, and `displayPieChart`. Each tool SHALL have an `execute` function (required by ToolLoopAgent) that returns acknowledgment, while actual chart rendering happens client-side via `message.parts`.

#### Scenario: Bar chart rendering

- **WHEN** the agent calls `displayBarChart`
- **AND** provides data array with objects containing index and value keys
- **THEN** the client SHALL render a `ResponsiveBar` chart from `@nivo/bar`
- **AND** use the `indexBy` config to determine category axis
- **AND** use the `keys` config to determine value bars

#### Scenario: Line chart rendering

- **WHEN** the agent calls `displayLineChart`
- **AND** provides data array with series objects containing `id` and `data` arrays
- **THEN** the client SHALL render a `ResponsiveLine` chart from `@nivo/line`
- **AND** support multiple series on the same chart

#### Scenario: Pie chart rendering

- **WHEN** the agent calls `displayPieChart`
- **AND** provides data array with objects containing `id`, `label`, and `value`
- **THEN** the client SHALL render a `ResponsivePie` chart from `@nivo/pie`
- **AND** display percentage labels on slices

#### Scenario: Invalid chart data validation

- **WHEN** a chart tool receives data that doesn't match the expected Zod schema
- **THEN** the client SHALL NOT crash
- **AND** SHALL display an error message instead of the chart

### Requirement: Tool Execute Functions

Each chart tool SHALL have an `execute` function because ToolLoopAgent only includes tools with `execute` in the model's tool list.

#### Scenario: Execute function behavior

- **WHEN** any chart tool's `execute` function is called
- **THEN** it SHALL return `{ rendered: true, chartType: '<type>', title: '<title>' }`
- **AND** the actual chart rendering SHALL happen client-side via `message.parts`

#### Scenario: ToolLoopAgent requirement

- **WHEN** a tool lacks an `execute` function
- **THEN** ToolLoopAgent SHALL NOT include it in the model's available tools
- **AND** the model MAY output the tool call as plain text instead of invoking it
- **THEREFORE** all chart tools MUST have `execute` functions

### Requirement: Chart Configuration Schemas

The system SHALL provide separate Zod schemas for each chart tool's configuration options.

#### Scenario: Bar chart configuration

- **WHEN** defining bar chart config
- **THEN** the schema SHALL require `indexBy` (string) and `keys` (string array)
- **AND** SHALL optionally accept `layout` (horizontal/vertical) defaulting to 'vertical'
- **AND** SHALL optionally accept `groupMode` (grouped/stacked) defaulting to 'grouped'

#### Scenario: Line chart configuration

- **WHEN** defining line chart config
- **THEN** the schema SHALL optionally accept `enableArea` (boolean) defaulting to false
- **AND** SHALL optionally accept `curve` ('linear'/'monotoneX'/'step'/'catmullRom') defaulting to 'monotoneX'

#### Scenario: Pie chart configuration

- **WHEN** defining pie chart config
- **THEN** the schema SHALL optionally accept `innerRadius` (0-0.9) defaulting to 0 (full pie, not donut)

### Requirement: Message Parts Rendering

The system SHALL render charts via the `message.parts` array pattern, where tool calls appear as typed parts with `part.type === 'tool-display<Type>Chart'`. Charts SHALL render as visual components, NOT as entries in the `MessageToolCalls` timeline.

#### Scenario: Tool part type matching

- **WHEN** iterating over `message.parts`
- **THEN** the system SHALL check for:
  - `part.type === 'tool-displayBarChart'`
  - `part.type === 'tool-displayLineChart'`
  - `part.type === 'tool-displayPieChart'`
- **AND** SHALL render the `ChartRenderer` component when matched
- **AND** SHALL extract the chart type from the tool name

#### Scenario: Part state handling - streaming

- **WHEN** `part.state === 'input-streaming'`
- **THEN** the system SHALL render a `ChartLoadingState` component
- **AND** SHALL NOT attempt to render the chart yet

#### Scenario: Part state handling - input available

- **WHEN** `part.state === 'input-available'`
- **THEN** the system SHALL render the chart using `part.input` data
- **AND** SHALL add `chartType` derived from the tool name to the data

#### Scenario: Part state handling - output available

- **WHEN** `part.state === 'output-available'`
- **THEN** the system SHALL continue displaying the rendered chart

#### Scenario: Part state handling - error

- **WHEN** `part.state === 'output-error'`
- **THEN** the system SHALL display `part.errorText` via `ChartError` component
- **AND** SHALL NOT attempt to render the chart

### Requirement: Separation from MessageToolCalls Timeline

Chart tools SHALL be rendered separately from other tools, not in the collapsible `MessageToolCalls` timeline component.

#### Scenario: Exclude from tool timeline

- **WHEN** `MessageItem` collects tool parts for `MessageToolCalls`
- **THEN** it SHALL filter out parts where `part.type` matches any chart tool
- **AND** only pass non-chart tools to `MessageToolCalls` component

#### Scenario: Visual chart rendering location

- **WHEN** chart tool call is present in message parts
- **THEN** the chart SHALL render inline in the message flow
- **AND** SHALL appear at the position where the tool call occurs in the parts array
- **AND** SHALL NOT be hidden inside a collapsible timeline

### Requirement: Chart Renderer Component

The system SHALL provide a `ChartRenderer` React component that renders Nivo charts based on tool call data.

#### Scenario: Responsive container

- **WHEN** rendering any chart type
- **THEN** the chart SHALL be wrapped in a container with minimum height of 400px
- **AND** SHALL use Nivo's `Responsive*` components for automatic width

#### Scenario: RTL support for Hebrew

- **WHEN** chart labels contain Hebrew text
- **THEN** the chart container SHALL have `dir="rtl"` attribute
- **AND** axis labels SHALL render correctly right-to-left

#### Scenario: Chart type switching

- **WHEN** `ChartRenderer` receives chart data
- **THEN** it SHALL switch on `chartType` to render the appropriate Nivo component
- **AND** SHALL pass chart-specific props based on the config schema

#### Scenario: Error and loading states

- **WHEN** chart data is invalid or missing
- **THEN** `ChartError` component SHALL display an error message
- **WHEN** chart is loading
- **THEN** `ChartLoadingState` component SHALL display a loading indicator

### Requirement: Tool Translations

Each chart tool SHALL have translations in `tool-translations.tsx`.

#### Scenario: Hebrew tool names

- **WHEN** displaying tool information in the UI
- **THEN** `displayBarChart` SHALL display as "הצגת תרשים עמודות"
- **AND** `displayLineChart` SHALL display as "הצגת תרשים קו"
- **AND** `displayPieChart` SHALL display as "הצגת תרשים עוגה"

#### Scenario: Tool icons

- **WHEN** displaying tool icons
- **THEN** `displayBarChart` SHALL use `BarChart2Icon`
- **AND** `displayLineChart` SHALL use `LineChartIcon`
- **AND** `displayPieChart` SHALL use `PieChartIcon`

### Requirement: Agent Chart Instructions

The agent instructions SHALL include general guidance on when and how to use the chart tools. Specific tool details are in each tool's description.

#### Scenario: Chart type selection guidance

- **WHEN** the agent has data suitable for visualization
- **THEN** it SHALL use `displayBarChart` for comparisons between categories
- **AND** SHALL use `displayLineChart` for trends over time/sequences
- **AND** SHALL use `displayPieChart` for part-of-whole distributions

#### Scenario: Data suitability assessment

- **WHEN** the agent retrieves numerical data from `queryDatastoreResource`
- **THEN** it SHALL assess whether the data has sufficient structure for charting
- **AND** SHALL only call chart tools when data has clear categorical/temporal dimensions

#### Scenario: Chart data formatting

- **WHEN** the agent decides to display a chart
- **THEN** it SHALL transform the raw query results into Nivo-compatible format
- **AND** SHALL provide meaningful labels in Hebrew where appropriate
- **AND** SHALL limit data points to avoid chart overcrowding (max 20 items recommended)
