# Proposal: Refactor Nadlan Data Source to Multi-Layer GovMap

## Change ID
`refactor-nadlan-to-govmap`

## Summary
Restructure `src/data-sources/nadlan/` into `src/data-sources/govmap/` — a multi-layer data source that can host any GovMap layer (real estate, parcels, gas stations, municipal areas, hotels, etc.). Extract shared GovMap HTTP infrastructure, create typed constants for all known layers/entities, and organize code into entity-based subfolders. All existing nadlan tool IDs remain unchanged for backwards compatibility.

## Motivation
The GovMap API (`govmap.gov.il`) exposes dozens of geospatial layers beyond real estate (nadlan): gas stations, parcel data, municipal boundaries, nature reserves, hotels, census data, bus stops, and more. The current `nadlan/` folder conflates GovMap platform infrastructure (HTTP client, rate limiting, autocomplete, coordinate helpers) with nadlan-specific business logic (deal schemas, market analysis). This coupling makes it impossible to add new GovMap layers without duplicating shared code.

By extracting the shared layer and organizing into entity subfolders, adding a new GovMap layer becomes a self-contained addition of `api/{layer}/` + `tools/{layer}/` without touching shared infrastructure.

## Prerequisites
- The `add-new-data-sources` change (current branch) must be completed — nadlan tools are already working.

## Scope

### In scope
- Rename `src/data-sources/nadlan/` to `src/data-sources/govmap/`
- Split API client into shared GovMap infrastructure vs. nadlan-specific logic
- Split API types into shared (AutocompleteResult, CoordinatePoint) vs. nadlan-specific (Deal, DealStatistics)
- Split API endpoints into shared (base URL, portal URL builder) vs. nadlan-specific (/real-estate/* paths)
- Create `govmap.constants.ts` with typed enums for all known layers, entity types, geometry types
- Create entity subfolders: `api/nadlan/`, `tools/nadlan/`
- Rename data source ID from `'nadlan'` to `'govmap'` across the codebase
- Rename agent from `nadlanAgent` to `govmapAgent` with expanded instructions
- Update all external references (registry, display types, CSS variables, SourcesPart, model config)
- Update contract tests

### Out of scope
- Adding new GovMap layers (gas stations, parcels, etc.) — this refactor only creates the structure
- Changing any existing nadlan tool behavior or IDs
- GovMap API key registration or authentication setup
- GovMap JavaScript client integration (govmap.search, govmap.filterLayers)

## Impact Analysis

### Files renamed/moved
- `src/data-sources/nadlan/` entire folder → `src/data-sources/govmap/`
- Internal restructuring into `api/nadlan/`, `tools/nadlan/` subfolders

### New files
- `src/data-sources/govmap/api/govmap.constants.ts` — layer/entity/geometry enums
- `src/data-sources/govmap/api/govmap.client.ts` — shared HTTP infrastructure
- `src/data-sources/govmap/api/govmap.endpoints.ts` — shared URL builders
- `src/data-sources/govmap/api/govmap.types.ts` — shared type definitions
- `src/data-sources/govmap/tools/index.ts` — cross-layer tool aggregator

### External files modified
- `src/data-sources/types/display.types.ts` — DataSource union: `'nadlan'` → `'govmap'`
- `src/data-sources/registry.ts` — imports, meta entry, allDataSourceTools
- `src/data-sources/registry.server.ts` — imports
- `src/agents/model.ts` — SubAgentId union, switch case
- `src/agents/agent.config.ts` — NADLAN_ID → GOVMAP_ID
- `src/components/chat/SourcesPart.tsx` — source config key, CSS classes
- `src/app/globals.css` — CSS variable renames (badge-nadlan → badge-govmap)
- `src/data-sources/CLAUDE.md` — documentation
- `CLAUDE.md` (project root) — architecture docs

## Risks
- **Stored data source ID**: If `'nadlan'` is persisted in Convex thread metadata, old conversations may lose badge styling. Mitigation: Verify with `rg 'nadlan'` in Convex schema; add fallback alias if needed.
- **Tool IDs unchanged**: All 8 nadlan tool IDs stay the same (`findRecentNadlanDeals`, etc.), so persisted conversations remain valid.

## Success Criteria
1. `tsc --noEmit` passes with zero errors
2. `npm run lint` passes
3. `npm run build` succeeds
4. Contract tests pass for `govmap-data-source.test.ts`
5. Dev server starts, nadlan queries work identically, badge shows "GovMap"
6. Adding a hypothetical new layer requires only new files in `api/{layer}/` + `tools/{layer}/` and a spread in the aggregator
