# Proposal: Merge Drugs and Health into Unified Health Data Source

## Change ID
`merge-drugs-health-datasource`

## Summary
Merge the separate `src/data-sources/drugs/` and `src/data-sources/health/` folders into a unified `src/data-sources/health/` data source with domain-based subfolders (`api/drugs/`, `api/overview-data/`, `tools/drugs/`, `tools/overview-data/`). Both sources are Ministry of Health APIs — the drug registry (`israeldrugs.health.gov.il`) and the health data overview-data (`dataoverview-data.health.gov.il`). A single `healthAgent` will handle all 13 tools across both domains.

## Motivation
The drugs and health data sources are both Ministry of Health services sharing the same organizational context. Currently they are:
- Two separate agents (`drugsAgent` + `healthAgent`) with identical processor pipelines
- Two separate entries in the routing agent's system prompt
- Two separate sub-agent delegations for related health queries
- Two separate landing page cards in the same "בריאות" category

Merging them into a single `healthAgent` that handles both drugs and overview-data data:
1. **Reduces routing complexity** — the routing agent no longer needs to decide between drugs vs health
2. **Saves context window** — one sub-agent delegation instead of two for cross-domain health queries
3. **Better UX** — single "משרד הבריאות" card on the landing page
4. **Mirrors real-world structure** — both APIs are under the Ministry of Health umbrella

## Prerequisites
- The `refactor-nadlan-to-govmap` change must be completed (establishes the multi-layer pattern)
- Current branch `feat/add-new-data-sources` with all data sources working

## Scope

### In scope
- Merge `src/data-sources/drugs/` into `src/data-sources/health/` with domain subfolders
- Split API clients into `api/drugs/` (drug registry) and `api/overview-data/` (health overview-data)
- Split tools into `tools/drugs/` (8 tools) and `tools/overview-data/` (5 tools)
- Create shared root files: `health.agent.ts`, `health.display.ts`, `health.translations.tsx`
- Merge agent instructions — single `healthAgent` with both drug + overview-data capabilities
- Remove `'drugs'` from `DataSource` type union
- Update registry to have single `'health'` entry with all 13 tools
- Update routing hints to reflect combined capabilities
- Remove `drugsAgent` from agent network

### Out of scope
- Adding new health tools or API endpoints
- Changing any existing tool IDs or behavior
- Modifying API client retry/concurrency logic
- Changes to the drugs or health API contracts

## Impact Analysis

### Files removed
- `src/data-sources/drugs/` entire folder (contents moved to `health/api/drugs/` and `health/tools/drugs/`)

### Files renamed/moved
- `src/data-sources/drugs/api/drugs.client.ts` → `src/data-sources/health/api/drugs/drugs.client.ts`
- `src/data-sources/drugs/api/drugs.endpoints.ts` → `src/data-sources/health/api/drugs/drugs.endpoints.ts`
- `src/data-sources/drugs/api/drugs.types.ts` → `src/data-sources/health/api/drugs/drugs.types.ts`
- `src/data-sources/drugs/tools/*.tool.ts` → `src/data-sources/health/tools/drugs/*.tool.ts`
- `src/data-sources/health/api/health.client.ts` → `src/data-sources/health/api/overview-data/overview-data.client.ts`
- `src/data-sources/health/api/health.endpoints.ts` → `src/data-sources/health/api/overview-data/overview-data.endpoints.ts`
- `src/data-sources/health/api/health.types.ts` → `src/data-sources/health/api/overview-data/overview-data.types.ts`
- `src/data-sources/health/tools/*.tool.ts` → `src/data-sources/health/tools/overview-data/*.tool.ts`

### New files
- `src/data-sources/health/tools/index.ts` — cross-domain tool aggregator (merges drugs + overview-data tools)

### External files modified
- `src/data-sources/types/display.types.ts` — remove `'drugs'` from DataSource union
- `src/data-sources/registry.ts` — remove drugs meta entry, merge tools/translations/resolvers into health entry
- `src/data-sources/registry.server.ts` — remove drugs agent import
- `src/agents/model.ts` — remove `'drugs'` from SubAgentId, remove switch case
- `src/agents/routing/config.ts` — routing hints auto-update (fewer agents listed)
- `src/app/globals.css` — remove `--badge-drugs*` CSS variables (or keep as alias)
- `src/data-sources/CLAUDE.md` — update documentation

## Risks
- **Stored data source ID**: If `'drugs'` is persisted in Convex thread metadata or tool-to-source maps, old conversations may lose badge styling. Mitigation: Add backwards-compat alias in `getToolDataSource()` or keep `'drugs'` as a secondary ID.
- **Tool IDs unchanged**: All 13 tool IDs stay the same, so persisted tool call data remains valid.
- **Agent instructions length**: Merging both agents' instructions into one may exceed effective prompt length. Mitigation: Condense shared patterns, keep domain-specific sections focused.
- **Routing regression**: The routing agent currently has separate hints for drugs vs health. After merge, a single hint must cover both. Mitigation: Write a comprehensive combined routing hint.

## Success Criteria
1. `tsc --noEmit` passes with zero errors
2. `npm run lint` passes
3. `npm run build` succeeds
4. Dev server starts, drug queries work identically, health overview-data queries work identically
5. Single "משרד הבריאות" card on landing page with combined stats
6. Routing agent delegates to single `healthAgent` for both drug and overview-data queries
7. All 13 tools accessible from the unified agent
8. Adding a hypothetical new health domain (e.g., mental health) requires only new files in `api/{domain}/` + `tools/{domain}/` and a spread in the aggregator
