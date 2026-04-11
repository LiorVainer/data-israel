# Spec: Unified Source URL Resolution

## ADDED Requirements

### REQ-1: Declarative ToolSourceConfig
Each tool that produces source URLs SHALL declare a `ToolSourceConfig` with a Hebrew `title` prefix instead of a hand-written resolver function. The registry auto-generates a type-safe resolver from this config.

#### Scenario: Standard tool with config
- **WHEN** a tool is registered with `sourceConfigs: { myTool: { title: 'נתונים' } }`
- **THEN** the registry generates a resolver that extracts `apiUrl`/`portalUrl` from the tool output
- **AND** builds titles as `"נתונים — {searchedResourceName}"` when a resource name is provided
- **AND** falls back to just `"נתונים"` when no resource name exists

#### Scenario: Custom resolver override
- **WHEN** a tool needs non-standard title construction (e.g., extracting `dataset.title` from nested output)
- **THEN** it provides a custom `ToolSourceResolver` in `sourceResolvers` which takes precedence over the config

### REQ-2: Generic ToolSourceResolver with typed input/output
`ToolSourceResolver` SHALL be generic: `ToolSourceResolver<TInput, TOutput>` with defaults:
- `TInput` defaults to `CommonToolInput` (`{ searchedResourceName: string }`)
- `TOutput` defaults to `ToolOutputSchemaType<{}>` (discriminated union with `apiUrl?`/`portalUrl?`)

Custom resolvers SHALL specify tool-specific types via `z.infer` for full type safety.

#### Scenario: Standard resolver uses defaults
- **WHEN** the generic `buildSourceResolver()` creates a resolver from `ToolSourceConfig`
- **THEN** it uses `ToolSourceResolver` with default type params
- **AND** TypeScript narrows `output.success` to access `apiUrl`/`portalUrl` without casts

#### Scenario: Custom resolver with specific types
- **WHEN** a resolver needs access to tool-specific output fields (e.g., `hebrewName`)
- **THEN** the tool file exports standalone types (`export type GetDrugDetailsInput = z.infer<typeof getDrugDetailsInputSchema>`)
- **AND** the resolver is typed as `ToolSourceResolver<GetDrugDetailsInput, GetDrugDetailsOutput>`
- **AND** TypeScript provides autocomplete and type checking for all fields
- **AND** `z.infer` is never used inline in the `ToolSourceResolver` type parameter

### REQ-3: Array-based return type
`ToolSourceResolver` SHALL return `ToolSource[]` instead of `ToolSource | null`. A single tool can produce multiple source URLs (API endpoint + portal page).

#### Scenario: Tool with both apiUrl and portalUrl
- **WHEN** a tool output contains both `apiUrl` and `portalUrl`
- **THEN** the resolver returns two entries: one `urlType: 'api'` and one `urlType: 'portal'`

#### Scenario: Tool with no source URLs
- **WHEN** output has `success: false`
- **THEN** the resolver returns `[]`

### REQ-4: Portal URLs in data tool outputs
All data tools that interact with external APIs SHALL include `portalUrl` in their output when a human-readable portal page exists. The portal URL construction logic moves from deleted `generate*SourceUrl` tools into the tool's `execute()` function.

#### Scenario: Knesset bill query
- **WHEN** `getBillInfo` returns successfully
- **THEN** output includes both `apiUrl` (OData endpoint) and `portalUrl` (knesset.gov.il page)

## MODIFIED Requirements

### REQ-5: Simplified MessageItem source collection
`MessageItem.tsx` SHALL collect source URLs via exactly 2 paths:
1. Native AI SDK `source-url` parts
2. Unified auto-resolution via `resolveToolSourceUrls()` for all tool outputs

#### Scenario: Backward compatibility
- **WHEN** old persisted messages contain `generate*SourceUrl` tool results
- **THEN** the URL is extracted via a deprecated fallback path

### REQ-6: DataSourceMeta uses sourceConfigs
`DataSourceMeta` SHALL accept `sourceConfigs: Partial<Record<string, ToolSourceConfig>>` as the primary way to declare source URLs. `sourceResolvers` remains optional for custom overrides.

#### Scenario: Registry resolution order
- **WHEN** `resolveToolSourceUrls()` is called for a tool
- **THEN** it checks `sourceResolvers` first (custom override), then falls back to `sourceConfigs` (generic)

## REMOVED Requirements

### REQ-7: Dedicated source URL tools
All 8 `generate*SourceUrl` tools SHALL be deleted.

#### Scenario: No dedicated tools
- **WHEN** any agent's tool list is inspected
- **THEN** no tool ID matching `generate*SourceUrl` exists

### REQ-8: Hand-written resolver functions
The 24 `resolveSourceUrl` function exports and their `isRecord()`/`getString()` helpers SHALL be removed from tool files. Source resolution is handled by declarative configs or custom overrides only.

#### Scenario: No resolver boilerplate in tool files
- **WHEN** a standard tool file is inspected
- **THEN** it contains no `resolveSourceUrl` export, no `isRecord()`, no `getString()`

### REQ-9: SOURCE_URL_TOOL_NAMES constant
The `SOURCE_URL_TOOL_NAMES` array SHALL be removed from `registry.ts`.
