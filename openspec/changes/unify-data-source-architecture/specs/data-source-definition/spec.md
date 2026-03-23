# data-source-definition Specification

## Purpose
Define the `DataSourceDefinition` interface and supporting types that enable self-contained, plug-and-play data source modules. Each data source folder provides everything needed: API client, tools, agent, translations, display config, and source URL resolvers.

## MODIFIED Requirements

### Requirement: Data Source Definition Interface
The system SHALL provide a generic `DataSourceDefinition<TTools>` interface that every data source module exports.

#### Scenario: Type-safe tool keys
- **WHEN** a data source defines `sourceResolvers` or `translations`
- **THEN** keys SHALL be validated against `keyof TTools & string`
- **AND** TypeScript SHALL report errors for misspelled tool names

#### Scenario: Source resolver derivation
- **WHEN** a data source provides `sourceResolvers`
- **THEN** the set of source-generating tool names SHALL be derived from `Object.keys(sourceResolvers)`
- **AND** no separate `sourceGeneratingToolNames` field SHALL exist

#### Scenario: Agent factory
- **WHEN** `createAgent(modelId)` is called
- **THEN** it SHALL return a fully configured `Agent` with tools, memory, and processors
- **AND** the agent ID SHALL match `agent.id`

### Requirement: Routing Hint Auto-Injection
Each data source SHALL provide a `routingHint` string that the routing agent's system prompt uses to describe when to delegate.

#### Scenario: Routing hint in definition
- **WHEN** a data source defines `routingHint`
- **THEN** it SHALL be a Hebrew string describing when to route to this agent
- **AND** it SHALL be specific enough for the LLM to distinguish between data sources

#### Scenario: Auto-generated prompt section
- **WHEN** the routing agent's system prompt is assembled
- **THEN** it SHALL call `buildRoutingHints()` from the registry
- **AND** append an "available agents" section listing each agent ID + its routing hint
- **AND** the rest of the routing prompt SHALL remain hand-written

#### Scenario: New data source routing
- **WHEN** a new data source is registered with a `routingHint`
- **THEN** it SHALL automatically appear in the routing agent's prompt
- **AND** no manual editing of the routing prompt SHALL be required for agent listing

### Requirement: Shared Zod Schema Fragments
The system SHALL provide reusable Zod schema fragments for common tool input/output patterns.

#### Scenario: Common input fields
- **WHEN** a tool uses `commonToolInput` in its input schema
- **THEN** `searchedResourceName` SHALL be included as a required string field

#### Scenario: Tool output helper
- **WHEN** `toolOutputSchema(successFields)` is called
- **THEN** it SHALL return a `z.discriminatedUnion` on `success` field
- **AND** success branch SHALL include `...commonSuccessOutput` merged with `successFields`
- **AND** error branch SHALL be `commonErrorOutput`

#### Scenario: External URLs extensibility
- **WHEN** `externalUrls` fragment is used
- **THEN** it SHALL include `apiUrl` (optional) and `portalUrl` (optional)
- **AND** new URL types can be added to the fragment without modifying individual tools

#### Scenario: searchedResourceName output removal
- **WHEN** a tool output is defined using `toolOutputSchema`
- **THEN** `searchedResourceName` SHALL NOT appear in the output schema
- **AND** the UI SHALL read `searchedResourceName` from tool input only

### Requirement: Data Source Registry
The system SHALL provide a central registry that collects all data source definitions.

#### Scenario: Tool aggregation
- **WHEN** `allDataSourceTools` is accessed
- **THEN** it SHALL be a const object merging all data source tools
- **AND** `typeof allDataSourceTools` SHALL provide exact key unions for type inference

#### Scenario: Agent aggregation
- **WHEN** `dataSourceAgents` is accessed
- **THEN** it SHALL be a typed const mapping agent IDs to agent instances
- **AND** `typeof dataSourceAgents` SHALL preserve exact key types (not `string`)

#### Scenario: Translation merging
- **WHEN** `getAllTranslations()` is called
- **THEN** it SHALL merge per-source translations with auto-generated `agent-*` entries
- **AND** agent translations SHALL use `display.label` as name and `display.icon` as icon
- **AND** agent translations SHALL use generic formatInput/formatOutput (echo prompt/text)

#### Scenario: Source URL resolution
- **WHEN** `resolveToolSourceUrl(toolType, input, output)` is called
- **THEN** it SHALL look up the resolver from a flat Map built from all data sources
- **AND** return `null` for tools without a resolver

#### Scenario: Tool data source lookup
- **WHEN** `getToolDataSource(toolKey)` is called with a tool name
- **THEN** it SHALL return the `DataSourceId` of the data source that owns the tool
- **AND** return `undefined` for unknown tools
- **AND** handle `agent-*` prefixed keys by extracting the agent ID

#### Scenario: DataSourceId type safety
- **WHEN** `DataSourceId` type is used
- **THEN** it SHALL be a union derived from registered data source `id` fields
- **AND** `AgentModelConfig` SHALL use it for type-safe model configuration

### Requirement: Co-located Source URL Resolvers
Tools that generate source URLs SHALL export a `resolveSourceUrl` function alongside the tool definition.

#### Scenario: Tool with resolver
- **WHEN** a tool file exports `resolveSourceUrl`
- **THEN** the data source `index.ts` SHALL collect it into `sourceResolvers`
- **AND** the registry SHALL include it in the flat resolver map

#### Scenario: Tool without resolver
- **WHEN** a tool file does not export `resolveSourceUrl`
- **THEN** it SHALL be omitted from `sourceResolvers`
- **AND** `resolveToolSourceUrl` SHALL return `null` for that tool

### Requirement: Translation Icon Unification
Tool translations SHALL store `LucideIcon` component references instead of JSX elements.

#### Scenario: Icon rendering
- **WHEN** a translation's `icon` field is accessed
- **THEN** it SHALL be a `LucideIcon` component (not a React element)
- **AND** consumers SHALL render it as `<icon className='h-4 w-4' />`

#### Scenario: toolIconMap elimination
- **WHEN** `getToolInfo(toolKey)` is called in `MessageToolCalls.tsx`
- **THEN** it SHALL read the icon from the unified translations map
- **AND** the separate `toolIconMap` constant SHALL NOT exist

### Requirement: Self-Contained Data Source Folder
Each data source folder SHALL contain all files needed to define the data source.

#### Scenario: CBS data source structure
- **GIVEN** the CBS data source
- **THEN** `src/data-sources/cbs/` SHALL contain:
  - `api/cbs.client.ts`, `api/cbs.types.ts`, `api/cbs.endpoints.ts`
  - `tools/` with `.tool.ts` suffixed files organized in subdirectories
  - `cbs.agent.ts` with merged factory + instructions
  - `cbs.translations.tsx` with CBS-only tool translations
  - `cbs.display.ts` with display + badge config
  - `index.ts` exporting `CbsDataSource` satisfying `DataSourceDefinition`

#### Scenario: File naming convention
- **WHEN** files are created in a data source folder
- **THEN** tool files SHALL use `.tool.ts` suffix
- **AND** agent files SHALL use `.agent.ts` suffix
- **AND** translation files SHALL use `.translations.tsx` suffix
- **AND** display files SHALL use `.display.ts` suffix
- **AND** API files SHALL use `{source}.client.ts`, `{source}.types.ts`, `{source}.endpoints.ts`

### Requirement: Clean Import Migration
All imports from old paths SHALL be updated to new paths with no re-export shims.

#### Scenario: No re-export files
- **WHEN** a file is moved to a new location
- **THEN** the old file SHALL be deleted entirely
- **AND** all consumers SHALL import from the new path

#### Scenario: Old directories emptied
- **WHEN** migration is complete
- **THEN** `src/lib/api/cbs/` and `src/lib/api/data-gov/` SHALL NOT exist
- **AND** `src/agents/network/cbs/` and `src/agents/network/datagov/` SHALL NOT exist
- **AND** `src/lib/tools/` SHALL contain only `client/` directory

### Requirement: Dead Code Removal
Unused or dissolved constants SHALL be removed or inlined.

#### Scenario: tool-result-fields dissolution
- **WHEN** `src/constants/tool-result-fields.ts` is processed
- **THEN** `TOOL_RESULT_KEEP_FIELDS`, `TOOL_RESULT_KEEP_NESTED`, `TOOL_ARGS_KEEP_FIELDS` SHALL move into `truncate-tool-results.processor.ts`
- **AND** `CHART_MAX_DATA_POINTS` SHALL move into `display-chart.tool.ts`
- **AND** `QUERY_MAX_FIELDS` SHALL move into `query-datastore-resource.tool.ts`
- **AND** `src/constants/tool-result-fields.ts` SHALL be deleted

#### Scenario: tools.utils.ts removal
- **WHEN** `src/lib/tools/tools.utils.ts` is checked for usage
- **THEN** it SHALL have zero imports across the codebase
- **AND** it SHALL be deleted
