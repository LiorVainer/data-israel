# Tasks: Refactor Nadlan to Multi-Layer GovMap

## Phase 1: Create shared GovMap infrastructure (new files, non-breaking)

- [x] 1.1 Create `src/data-sources/govmap/api/govmap.constants.ts` with GOVMAP_LAYERS, GOVMAP_ENTITY_TYPES, GOVMAP_GEOMETRY_TYPES as typed const objects with derived union types
- [x] 1.2 Extract shared HTTP client into `src/data-sources/govmap/api/govmap.client.ts` (axios instance, rate limiter, retry logic, `govmapRequest<T>()`, `parseCoordinatesFromShape()`) from current `nadlan.client.ts`
- [x] 1.3 Extract shared types into `src/data-sources/govmap/api/govmap.types.ts` (AutocompleteResult, AutocompleteResponse, CoordinatePoint) from current `nadlan.types.ts`
- [x] 1.4 Extract shared URL builders into `src/data-sources/govmap/api/govmap.endpoints.ts` (GOVMAP_BASE_URL, GOVMAP_PORTAL_BASE_URL, buildGovmapUrl(), buildGovmapPortalUrl()) from current `nadlan.endpoints.ts`

## Phase 2: Rename folder and restructure internals

- [x] 2.1 `git mv src/data-sources/nadlan src/data-sources/govmap`
- [x] 2.2 Create `api/nadlan/` subfolder; move nadlan-specific API files (nadlan.client.ts, nadlan.types.ts, nadlan.endpoints.ts) into it
- [x] 2.3 Update nadlan.client.ts to import shared infrastructure from `../govmap.client` instead of local definitions
- [x] 2.4 Update nadlan.types.ts to import shared types from `../govmap.types` and keep only nadlan-specific types
- [x] 2.5 Update nadlan.endpoints.ts to import from `../govmap.endpoints` and keep only /real-estate/* paths
- [x] 2.6 Create `tools/nadlan/` subfolder; move all 8 tool files + current tools/index.ts into it
- [x] 2.7 Create new `tools/index.ts` aggregator: GovmapTools = { ...NadlanTools }, GovmapToolName, govmapSourceResolvers
- [x] 2.8 Fix all internal import paths in tool files (api paths now deeper by one level)
- [x] 2.9 Run `tsc --noEmit` — fix any remaining import issues

## Phase 3: Rename root module files and identifiers

- [x] 3.1 Rename `nadlan.agent.ts` → `govmap.agent.ts`; update agent ID to `govmapAgent`, name to `סוכן GovMap`, expand instructions with multi-layer preamble
- [x] 3.2 Rename `nadlan.display.ts` → `govmap.display.ts`; update label, badge nameLabel, CSS class to `badge-govmap`
- [x] 3.3 Rename `nadlan.translations.tsx` → `govmap.translations.tsx`; update export name to `govmapTranslations`
- [x] 3.4 Update `index.ts` to export `GovmapDataSource` with `id: 'govmap'`, referencing `govmapAgent`, `GovmapTools`, etc.
- [x] 3.5 Rename `__tests__/nadlan-data-source.test.ts` → `__tests__/govmap-data-source.test.ts`; update all assertions for new IDs

## Phase 4: Update all external references

- [x] 4.1 `src/data-sources/types/display.types.ts` — change `'nadlan'` to `'govmap'` in DataSource union
- [x] 4.2 `src/data-sources/registry.ts` — update imports from `@/data-sources/govmap/...`, rename variables (NadlanTools→GovmapTools, etc.), update meta entry (id, agentId, landing, display)
- [x] 4.3 `src/data-sources/registry.server.ts` — update import to `GovmapDataSource` from `./govmap`
- [x] 4.4 `src/agents/model.ts` — change `'nadlan'` to `'govmap'` in SubAgentId union and switch case
- [x] 4.5 `src/agents/agent.config.ts` — rename `NADLAN_ID` to `GOVMAP_ID`, update env var name
- [x] 4.6 `src/components/chat/SourcesPart.tsx` — rename key `'nadlan'` → `'govmap'`, update nameLabel and CSS classes
- [x] 4.7 `src/app/globals.css` — rename CSS variables `--badge-nadlan` → `--badge-govmap` (6 occurrences: 2 color mappings + 2 light values + 2 dark values)

## Phase 5: Verification and documentation

- [x] 5.1 Run `tsc --noEmit` — zero errors
- [x] 5.2 Run `npm run lint` — passes (1 pre-existing warning only)
- [x] 5.3 Run contract tests: `npx vitest run src/data-sources/govmap/__tests__/govmap-data-source.test.ts` — 9/9 pass
- [x] 5.4 Run `npm run build` — production build succeeds
- [x] 5.5 Update `src/data-sources/CLAUDE.md` — folder references, DataSource union, conventions
- [x] 5.6 Update project root `CLAUDE.md` — agent table, architecture diagram, data source references

## Dependencies
- Phase 2 depends on Phase 1 (shared files must exist before nadlan files can import them)
- Phase 3 depends on Phase 2 (folder must be renamed first)
- Phase 4 depends on Phase 3 (new export names must exist before external references can use them)
- Phase 5 runs after Phase 4

## Parallelization
- Tasks 1.1-1.4 can run in parallel (independent new files)
- Tasks 2.2-2.5 must be sequential (each depends on prior subfolder creation)
- Tasks 4.1-4.7 can run in parallel (independent external files)
- Tasks 5.1-5.4 must be sequential (each gate must pass before proceeding)
