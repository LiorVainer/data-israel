# Tasks: Unify Data Source Architecture

## Phase 1: Foundation (types + shared schemas)

- [x] 1.1 Create `src/data-sources/types/` directory structure
- [x] 1.2 **TEST** Create `src/data-sources/types/__tests__/tool-schemas.test.ts` — test `toolOutputSchema()` produces valid discriminated union, success branch includes common fields + custom fields, error branch matches `commonErrorOutput`, `commonToolInput` includes `searchedResourceName`
- [x] 1.3 Create `tool-schemas.ts` — `commonToolInput`, `externalUrls`, `commonSuccessOutput`, `commonErrorOutput`, `toolOutputSchema()` — pass tests from 1.2
- [x] 1.4 Create `display.types.ts` — move `DataSource`, `DataSourceConfig`, `AgentDisplayInfo` from `constants/tool-data-sources.ts` and `constants/agents-display.ts`
- [x] 1.5 Create `tool.types.ts` — `ToolSourceResolver`, `ToolTranslation` (with `LucideIcon` instead of JSX), `ToolIOMap`, `ToolName`, `ToolInput<T>`, `ToolOutput<T>`
- [x] 1.6 Create `data-source.types.ts` — `DataSourceDefinition<TTools>` interface
- [x] 1.7 Create `types/index.ts` — re-export all types
- [x] 1.8 Create `src/data-sources/CLAUDE.md` — architecture guide + "how to add a data source" checklist
- [x] 1.9 Run `npm run build && npm run lint && tsc` — verify types compile
- [x] 1.10 Run `npm run test` — verify schema tests pass

## Phase 2: Migrate CBS data source

- [x] 2.1 Create `src/data-sources/cbs/api/` — move `cbs.client.ts`, `cbs.types.ts`, `cbs.endpoints.ts` from `src/lib/api/cbs/`
- [x] 2.2 Rename CBS tool files to `.tool.ts` suffix and move to `src/data-sources/cbs/tools/`
- [x] 2.3 Update CBS tool schemas to use `commonToolInput`, `toolOutputSchema()`, remove `searchedResourceName` from outputs
- [x] 2.4 Add co-located `resolveSourceUrl` exports to CBS tools that generate source URLs
- [x] 2.5 Update CBS tools `index.ts` — collect `CbsTools`, `CbsToolName`, source resolvers
- [x] 2.6 Create `cbs.display.ts` — extract CBS display + badge config from constants
- [x] 2.7 Create `cbs.translations.tsx` — extract CBS entries from `tool-translations.tsx`, use `LucideIcon`
- [x] 2.8 Create `cbs.agent.ts` — merge `cbs.agent.ts` + `config.ts` into single factory + instructions file
- [x] 2.9 Create `cbs/index.ts` — export `CbsDataSource satisfies DataSourceDefinition` (include `routingHint`)
- [x] 2.10 **TEST** Create `src/data-sources/cbs/__tests__/cbs-data-source.test.ts`:
  - CBS definition satisfies `DataSourceDefinition` contract
  - All keys in `translations` exist in `tools`
  - All keys in `sourceResolvers` exist in `tools`
  - `agent.createAgent(modelId)` returns Agent with id `cbsAgent`
  - Source resolvers return `ToolSource` for valid output, `null` for failed output
  - No tool output schema contains `searchedResourceName`
- [x] 2.11 Update all CBS imports across codebase to new paths
- [x] 2.12 Run `npm run build && npm run lint && tsc && npm run test` — verify CBS migration

## Phase 3: Migrate DataGov data source

- [x] 3.1 Create `src/data-sources/datagov/api/` — move client, types, endpoints; merge `datagov-urls.ts` from constants into `datagov.endpoints.ts`
- [x] 3.2 Rename DataGov tool files to `.tool.ts` suffix and move to `src/data-sources/datagov/tools/`
- [x] 3.3 Update DataGov tool schemas to use `commonToolInput`, `toolOutputSchema()`, remove `searchedResourceName` from outputs
- [x] 3.4 Add co-located `resolveSourceUrl` exports to DataGov tools that generate source URLs
- [x] 3.5 Update DataGov tools `index.ts` — collect `DataGovTools`, `DataGovToolName`, source resolvers
- [x] 3.6 Create `datagov.display.ts` — extract DataGov display + badge config from constants
- [x] 3.7 Create `datagov.translations.tsx` — extract DataGov entries from `tool-translations.tsx`, use `LucideIcon`
- [x] 3.8 Create `datagov.agent.ts` — merge agent + config into single file
- [x] 3.9 Create `datagov/index.ts` — export `DataGovDataSource satisfies DataSourceDefinition` (include `routingHint`)
- [x] 3.10 **TEST** Create `src/data-sources/datagov/__tests__/datagov-data-source.test.ts`:
  - DataGov definition satisfies `DataSourceDefinition` contract
  - All keys in `translations` exist in `tools`
  - All keys in `sourceResolvers` exist in `tools`
  - `agent.createAgent(modelId)` returns Agent with id `datagovAgent`
  - Source resolvers return `ToolSource` for valid output, `null` for failed output
  - No tool output schema contains `searchedResourceName`
- [x] 3.11 Update all DataGov imports across codebase to new paths
- [x] 3.12 Run `npm run build && npm run lint && tsc && npm run test` — verify DataGov migration

## Phase 4: Registry + agents wiring

- [x] 4.1 **TEST** Create `src/data-sources/__tests__/registry.test.ts`:
  - `allDataSourceTools` contains all tools from CBS + DataGov
  - `getToolDataSource('browseCbsCatalog')` returns `'cbs'`
  - `getToolDataSource('searchDatasets')` returns `'datagov'`
  - `getToolDataSource('agent-cbsAgent')` returns `'cbs'`
  - `getToolDataSource('unknownTool')` returns `undefined`
  - `resolveToolSourceUrl()` calls correct resolver for known tool
  - `resolveToolSourceUrl()` returns `null` for tool without resolver
  - `getAllTranslations()` includes per-source translations
  - `getAllTranslations()` includes auto-generated `agent-cbsAgent` and `agent-datagovAgent`
  - Auto-generated agent translations use `display.label` as name and `display.icon` as icon
  - `buildRoutingHints()` returns string containing all agent IDs and hints
  - `dataSourceAgents` has entries for all registered data sources
- [x] 4.2 Create `src/data-sources/registry.ts` — pass tests from 4.1
- [x] 4.3 Move `src/agents/network/model.ts` → `src/agents/model.ts`
- [x] 4.4 Move `src/agents/network/routing/` → `src/agents/routing/`, update routing agent prompt to use `buildRoutingHints()` for agent listing section
- [x] 4.5 Update `src/agents/mastra.ts` — use `dataSourceAgents` from registry, derive `AgentModelConfig` from `DataSourceId`
- [x] 4.6 Update `src/agents/types.ts` — use `allDataSourceTools` + `ClientTools` for `AllTools` / `AppUITools`
- [x] 4.7 Delete `src/agents/network/index.ts` and empty `network/` directory
- [x] 4.8 Run `npm run build && npm run lint && tsc && npm run test` — verify agent wiring

## Phase 5: Client tools + UI updates

- [x] 5.1 Rename client tool files to `.tool.ts` suffix, inline `CHART_MAX_DATA_POINTS`
- [x] 5.2 Create `src/lib/tools/client/translations.tsx` — extract client tool translations, use `LucideIcon`
- [x] 5.3 Update `MessageToolCalls.tsx` — remove `toolIconMap`, read icon from unified translations (registry + client)
- [x] 5.4 Update `ToolCallParts.tsx` — read `searchedResourceName` from input only (remove output fallback)
- [x] 5.5 Update `AgentInternalCallsChain.tsx` — imports from registry
- [x] 5.6 Update source URL resolution consumers to use `resolveToolSourceUrl` from registry
- [x] 5.7 Run `npm run build && npm run lint && tsc && npm run test` — verify UI updates

## Phase 6: Dead code cleanup

- [x] 6.1 Inline `TOOL_RESULT_KEEP_FIELDS`, `TOOL_RESULT_KEEP_NESTED`, `TOOL_ARGS_KEEP_FIELDS` into `truncate-tool-results.processor.ts`
- [x] 6.2 Inline `QUERY_MAX_FIELDS` into `query-datastore-resource.tool.ts`
- [x] 6.3 Delete `src/constants/tool-result-fields.ts`
- [x] 6.4 Delete `src/constants/agents-display.ts`
- [x] 6.5 Delete `src/constants/tool-translations.tsx`
- [x] 6.6 Delete `src/constants/tool-data-sources.ts`
- [x] 6.7 Delete `src/constants/datagov-urls.ts`
- [x] 6.8 Delete `src/lib/tools/types.ts`
- [x] 6.9 Delete `src/lib/tools/tool-names.ts`
- [x] 6.10 Delete `src/lib/tools/tools.utils.ts`
- [x] 6.11 Delete `src/lib/tools/source-url-resolvers.ts`
- [x] 6.12 Delete `src/lib/tools/index.ts`
- [x] 6.13 Delete `src/lib/api/cbs/` directory
- [x] 6.14 Delete `src/lib/api/data-gov/` directory
- [x] 6.15 Run `npm run build && npm run lint && tsc && npm run test` — final verification

## Phase 7: Validation

- [ ] 7.1 Run `npm run build` — production build succeeds
- [ ] 7.2 Run `npm run lint` — no ESLint violations
- [ ] 7.3 Run `npm run vibecheck` — code quality check passes
- [ ] 7.4 Verify no remaining imports from deleted paths (`rg` check)
- [ ] 7.5 Run `npm run test` — all tests pass (including new data source tests)
- [ ] 7.6 Run `tsc` — zero TypeScript errors

## Notes

- **Phases 2 and 3** can run in parallel (independent data sources)
- **Phase 4** depends on both phases 2 and 3 completing
- **Phase 5** depends on phase 4 (registry must exist)
- **Phase 6** can partially overlap with phase 5 (delete files as their replacements are verified)
- Each phase ends with a build + test verification gate
- **TDD pattern**: Test tasks (marked **TEST**) come before or alongside implementation. Write the test, then implement to pass it.
- **Data source tests are structural contracts**: They verify the `DataSourceDefinition` interface is satisfied, translations/resolvers match tool keys, and `searchedResourceName` is input-only. Every new data source MUST have these tests.
