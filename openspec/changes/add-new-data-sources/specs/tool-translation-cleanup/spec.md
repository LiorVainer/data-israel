# tool-translation-cleanup

## MODIFIED Requirements

### Requirement: Simplified ToolTranslation Interface
The `ToolTranslation` interface SHALL contain only `name` (Hebrew display name) and `icon` (LucideIcon component). The `formatInput` and `formatOutput` functions SHALL be removed as they are unused by the rendering pipeline.

#### Scenario: Translation with name and icon only
- **GIVEN** a data source defines a tool translation
- **WHEN** the translation is registered in the registry
- **THEN** it SHALL only require `name` and `icon` fields
- **AND** SHALL NOT require `formatInput` or `formatOutput`

#### Scenario: getToolInfo returns name and icon
- **GIVEN** a tool name is looked up via `getToolInfo()`
- **WHEN** a translation exists for that tool
- **THEN** it SHALL return the `name` and `icon` from the translation
- **AND** fall back to the raw tool name and `SearchIcon` if no translation exists

## REMOVED Requirements

### Requirement: Remove Dead UI Components
The following dead code SHALL be removed:
- `MessageToolCalls` component (never rendered)
- `ToolCallCard` component (never imported)
- `getToolDescription()` function (never imported outside barrel export)
- `getToolIO()` function (only used internally by dead `MessageToolCalls`)
- `ToolIO` type (only used by dead `getToolIO`)

#### Scenario: Dead code removal does not break existing UI
- **GIVEN** the dead components and functions are removed
- **WHEN** the application builds and renders
- **THEN** all existing chat UI functionality SHALL continue working unchanged
- **AND** `getToolInfo()` SHALL remain available (it IS used)

### Requirement: Remove formatInput/formatOutput from existing translations
All existing translation files (`datagov.translations.tsx`, `cbs.translations.tsx`, `client/translations.tsx`) SHALL have their `formatInput` and `formatOutput` functions removed, along with any helper functions used only by those formatters.

#### Scenario: Existing DataGov translations simplified
- **GIVEN** `datagov.translations.tsx` contains formatting functions and helpers
- **WHEN** the cleanup is applied
- **THEN** each tool translation SHALL only contain `name` and `icon`
- **AND** helper functions (getString, getNumber, getArray, translateSort, etc.) SHALL be removed if unused

## ADDED Requirements

### Requirement: Per-Source Resource Extractors
Each `DataSourceDefinition` SHALL declare `resourceExtractors` — a partial record mapping tool names to extractor functions that produce chip labels for `AgentInternalCallsChain`.

#### Scenario: Existing extractToolResource logic migrated
- **GIVEN** the generic `extractToolResource()` in `ToolCallParts.tsx` contains field extraction logic
- **WHEN** it is refactored to per-source extractors
- **THEN** each data source SHALL provide its own extractors for tools that produce resource chips
- **AND** the generic function SHALL remain as a fallback for tools without a registered extractor

#### Scenario: MCPClient tool resource extraction
- **GIVEN** BudgetKey tools are namespaced as `budgetkey_ToolName`
- **WHEN** the budget data source provides `resourceExtractors`
- **THEN** it SHALL extract display labels from BudgetKey-specific fields (e.g., `dataset` arg, `q` arg)
