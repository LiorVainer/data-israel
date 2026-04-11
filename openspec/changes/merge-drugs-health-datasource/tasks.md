# Tasks: Merge Drugs and Health into Unified Health Data Source

## Phase 1: Create Domain Subfolder Structure (parallel)

- [x] **1.1** Create `src/data-sources/health/api/drugs/` subfolder, move drug API files:
  - `drugs.client.ts`, `drugs.endpoints.ts`, `drugs.types.ts`
  - Update all internal import paths within drug tool files

- [x] **1.2** Rename existing health API files into `api/overview-data/` subfolder:
  - `health.client.ts` → `overview-data.client.ts`
  - `health.endpoints.ts` → `overview-data.endpoints.ts`
  - `health.types.ts` → `overview-data.types.ts`
  - Update all internal import paths within overview-data tool files

- [x] **1.3** Create `src/data-sources/health/tools/drugs/` subfolder, move all 8 drug tool files:
  - Move all `.tool.ts` files + `index.ts`
  - Update import paths to reference `../../api/drugs/` instead of `../api/`

- [x] **1.4** Move existing health tool files into `tools/overview-data/` subfolder:
  - Move all 5 `.tool.ts` files + `index.ts`
  - Update import paths to reference `../../api/overview-data/`

## Phase 2: Create Unified Root Files

- [x] **2.1** Create unified `tools/index.ts` aggregator:
  - Import `DrugsTools` from `./drugs/` and `DashboardTools` from `./overview-data/`
  - Export `HealthTools = { ...DrugsTools, ...DashboardTools }` (13 tools)
  - Export merged `healthSourceResolvers` combining both domains
  - Export `HealthToolName` type union

- [x] **2.2** Merge agent instructions in `health.agent.ts`:
  - Single `createHealthAgent(modelId)` factory
  - Combined i/sl..דnstructions with drugs + overview-data sections
  - Agent ID: `'healthAgent'` (unchanged)
  - All 13 tools registered
  - Same processor pipeline (FailedToolCallGuard, EnsureTextOutput, TruncateToolResults)

- [x] **2.3** Merge translations in `health.translations.tsx`:
  - Import drug translations + overview-data translations
  - Export single `healthTranslations` record (13 entries)

- [x] **2.4** Update `health.display.ts`:
  - Single display config for "משרד הבריאות"
  - Icon: `HeartPulseIcon`
  - Badge: single health badge config

- [x] **2.5** Update `index.ts` (DataSourceDefinition):
  - Single `HealthDataSource` export
  - Tools: unified `HealthTools` (13 tools)
  - Source resolvers: merged from both domains
  - Translations: merged
  - Landing: combined stats, single card
  - Routing hint: combined drugs + overview-data description
  - Suggestions: merge best prompts from both

## Phase 3: Remove Drugs Data Source & Update External References (parallel)

- [x] **3.1** Delete `src/data-sources/drugs/` folder entirely (contents now in `health/`)

- [x] **3.2** Update `src/data-sources/types/display.types.ts`:
  - Remove `'drugs'` from `DataSource` union type

- [x] **3.3** Update `src/data-sources/registry.ts`:
  - Remove drugs meta entry from `DATA_SOURCE_METAS`
  - Update health meta entry with merged tools, translations, resolvers, suggestions
  - Update imports (remove drugs imports, add new health paths)

- [x] **3.4** Update `src/data-sources/registry.server.ts`:
  - Remove `createDrugsAgent` import
  - Remove drugs entry from `dataSourceAgents`

- [x] **3.5** Update `src/agents/model.ts`:
  - Remove `'drugs'` from SubAgentId type / switch cases

- [x] **3.6** Update `src/app/globals.css`:
  - Remove `--badge-drugs*` CSS variables (or alias to health)

## Phase 4: Verification & Documentation

- [x] **4.1** Run `tsc --noEmit` — zero errors
- [x] **4.2** Run `npm run build` — succeeds
- [x] **4.3** Start dev server, test drug queries (search by name, get details, generic alternatives)
- [x] **4.4** Start dev server, test health overview-data queries (subjects, metadata, data)
- [x] **4.5** Verify landing page shows single "משרד הבריאות" card in "בריאות" tab
- [x] **4.6** Verify routing agent delegates to single `healthAgent` for both drug and overview-data queries
- [x] **4.7** Update `src/data-sources/CLAUDE.md` and `CLAUDE.md` with new structure
- [x] **4.8** Update `src/data-sources/health/__tests__/` contract tests

## Dependencies
- Phase 2 depends on Phase 1 (subfolders must exist before aggregation)
- Phase 3 depends on Phase 2 (unified root files must exist before removing drugs)
- Phase 4 depends on Phase 3 (all changes must be complete before verification)
- Within Phase 1: tasks 1.1-1.4 can run in parallel
- Within Phase 3: tasks 3.1-3.6 can run in parallel
