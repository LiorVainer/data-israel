# Proposal: Unify Data Source Architecture

## Change ID
`unify-data-source-architecture`

## Summary
Consolidate the scattered per-data-source definitions (agent, tools, API client, translations, display config, source URL resolvers) into self-contained `src/data-sources/{source}/` folders with a shared `DataSourceDefinition<TTools>` interface. Adding a new data source drops from ~16 file touches to 3 (create folder, register in registry, update routing prompt).

## Motivation
Today a data source's identity is spread across 6+ directories with no single definition point:
- `src/lib/api/{source}/` — API client
- `src/lib/tools/{source}/` — tool definitions
- `src/agents/network/{source}/` — agent factory + config
- `src/constants/tool-translations.tsx` — Hebrew tool names/formatters (30+ manual entries)
- `src/constants/agents-display.ts` — agent display metadata
- `src/constants/tool-data-sources.ts` — DataSource union + badge config
- `src/lib/tools/source-url-resolvers.ts` — giant switch statement per tool
- `src/lib/tools/tool-names.ts` — categorized arrays

This creates high friction when adding new data sources and risks desynchronization between files.

## Scope
- **In scope**: Data source folder structure, `DataSourceDefinition` interface, registry, shared Zod schemas, tool output simplification, import migration, dead code removal
- **Out of scope**: Routing agent prompt changes, UI component refactoring, new data sources, test additions

## Key Design Decisions

### 1. Folder structure
Each data source gets a self-contained folder under `src/data-sources/`:
```
src/data-sources/
├── types/
│   ├── index.ts
│   ├── data-source.types.ts
│   ├── tool.types.ts
│   ├── tool-schemas.ts
│   └── display.types.ts
├── registry.ts
├── cbs/
│   ├── api/
│   ├── tools/
│   ├── cbs.agent.ts
│   ├── cbs.translations.tsx
│   ├── cbs.display.ts
│   └── index.ts
└── datagov/
    ├── api/
    ├── tools/
    ├── datagov.agent.ts
    ├── datagov.translations.tsx
    ├── datagov.display.ts
    └── index.ts
```

### 2. DataSourceDefinition interface
Generic over `TTools`, with type-safe `sourceResolvers` and `translations` keyed by `keyof TTools`. No `sourceGeneratingToolNames` — derived from `sourceResolvers` keys.

### 3. Shared Zod schemas
- `commonToolInput` — `searchedResourceName` (input only, removed from output schemas)
- `externalUrls` — `apiUrl`, `portalUrl` (extensible fragment)
- `toolOutputSchema()` — helper builds discriminated union with common error shape
- Eliminates ~6 lines of boilerplate per tool

### 4. Registry
- Collects all data sources into typed exports
- `allDataSourceTools` — merged tool objects for type derivation
- `dataSourceAgents` — typed const for `mastra.ts`
- Auto-generates `agent-*` translations from `display` config
- `resolveToolSourceUrl()` — map lookup replaces switch statement
- Exports `DataSourceId` union for type-safe `AgentModelConfig`

### 5. Routing hints
Each `DataSourceDefinition` includes a `routingHint: string` — a Hebrew description of when to delegate to this agent. The routing agent's system prompt auto-appends an "Available agents" section generated from the registry, e.g.:
```
סוכנים זמינים:
- datagovAgent: השתמש בסוכן זה לחיפוש מאגרי מידע ממשלתיים פתוחים מ-data.gov.il
- cbsAgent: השתמש בסוכן זה לנתונים סטטיסטיים מהלמ"ס
```
The rest of the routing prompt remains hand-written.

### 6. Source URL resolvers
Co-located in each `.tool.ts` file (tools that generate sources export a `resolveSourceUrl` function). Collected by data source `index.ts`, merged by registry. No central switch.

### 7. Translation icons
Store `LucideIcon` component reference instead of JSX element. `toolIconMap` in `MessageToolCalls.tsx` eliminated — registry provides both name and icon.

### 8. `searchedResourceName` simplification
Removed from all output schemas — kept as input-only field. `stripToolArgs` already preserves it. UI reads from `input.searchedResourceName` directly.

### 9. Agents const derivation
`mastra.ts` uses `{ routingAgent, ...dataSourceAgents }` where `dataSourceAgents` is a typed const from registry. `AgentModelConfig` uses `DataSourceId` union.

### 10. Dead code removal
- `src/lib/tools/tools.utils.ts` — unused
- `src/constants/tool-result-fields.ts` — dissolved (constants inlined into consumers)
- `CHART_MAX_DATA_POINTS` → inlined in `display-chart.tool.ts`
- `QUERY_MAX_FIELDS` → inlined in `query-datastore-resource.tool.ts`
- `TOOL_RESULT_KEEP_*` → inlined in `truncate-tool-results.processor.ts`

## Files Deleted
| File | Replacement |
|------|-------------|
| `src/constants/agents-display.ts` | `*.display.ts` per data source + registry |
| `src/constants/tool-translations.tsx` | `*.translations.tsx` per data source + registry |
| `src/constants/tool-data-sources.ts` | `src/data-sources/types/display.types.ts` + registry |
| `src/constants/tool-result-fields.ts` | Constants inlined into consumers |
| `src/constants/datagov-urls.ts` | Moved to `src/data-sources/datagov/api/datagov.endpoints.ts` |
| `src/lib/tools/types.ts` | `src/data-sources/types/tool.types.ts` |
| `src/lib/tools/tool-names.ts` | `src/data-sources/registry.ts` |
| `src/lib/tools/tools.utils.ts` | Deleted (unused) |
| `src/lib/tools/source-url-resolvers.ts` | Per-tool resolvers + registry |
| `src/lib/tools/index.ts` | Direct imports from data sources |
| `src/lib/api/cbs/` (all files) | `src/data-sources/cbs/api/` |
| `src/lib/api/data-gov/` (all files) | `src/data-sources/datagov/api/` |
| `src/agents/network/cbs/` (all files) | `src/data-sources/cbs/` |
| `src/agents/network/datagov/` (all files) | `src/data-sources/datagov/` |
| `src/agents/network/index.ts` | Registry exports |
| `src/agents/network/model.ts` | `src/agents/model.ts` |

## Files Modified
| File | Change |
|------|--------|
| `src/agents/mastra.ts` | Use `dataSourceAgents` from registry |
| `src/agents/types.ts` | Use `allDataSourceTools` from registry |
| `src/agents/routing/routing.agent.ts` | Moved from `network/routing/` |
| `src/agents/processors/truncate-tool-results.processor.ts` | Inline keep-field constants |
| `src/components/chat/MessageToolCalls.tsx` | Remove `toolIconMap`, use registry translations |
| `src/components/chat/ToolCallParts.tsx` | Read `searchedResourceName` from input only |
| `src/components/chat/AgentInternalCallsChain.tsx` | Import from registry |
| All tool files | Add `.tool.ts` suffix, use shared schemas, remove `searchedResourceName` from output |
| All files importing from moved paths | Update import paths |

## Impact
- **Adding a new data source**: Create `src/data-sources/{name}/` folder (with `routingHint`), add one line in `registry.ts` — routing prompt auto-updates via `buildRoutingHints()`
- **Zero UI changes needed**: Registry provides same lookup functions
- **Type safety preserved**: `DataSourceId`, `ToolName`, `AgentName` all remain typed unions
- **No runtime behavior change**: Pure structural refactor

## Risks
- Large import path migration (mitigated: mechanical find-replace)
- `searchedResourceName` output removal could affect edge cases in truncated message replay (mitigated: `stripToolArgs` already preserves it from input)
