# Proposal: Add GovMap Map Layers Data Source

## Change ID
`add-govmap-layers`

## Summary
Add a new "layers" sub-API within the existing GovMap data source that queries the `layers-catalog/entitiesByPoint` REST endpoint — a **token-free** endpoint that returns entities from any of GovMap's 122 government map layers near a geographic point. This adds 4 new tools to the govmap agent, covering nearby services, land parcels, tourism, and area intelligence.

## Motivation
The GovMap data source currently only covers real estate (nadlan — 7 tools). GovMap's `layers-catalog` REST API exposes 122+ map layers — hospitals, police stations, parcels, neighborhoods, bus stops, hotels, nature reserves, and more — all queryable without an API token via `POST /api/layers-catalog/entitiesByPoint`. Users frequently ask "what's near this address?" or "tell me about this area" — questions that require combining data from multiple map layers. Adding these tools transforms the govmap agent from a single-domain real-estate tool into a comprehensive Israeli geospatial data assistant.

## Prerequisites
- The `refactor-nadlan-to-govmap` change (completed) — the multi-layer folder structure exists.
- GovMap API research completed — endpoints verified, field schemas documented in `.claude/skills/govmap-api/`.

## Scope

### In scope
- New API client: `src/data-sources/govmap/api/layers/` — typed client for `entitiesByPoint` and `layer/{id}/metadata`
- 4 new tools in `src/data-sources/govmap/tools/layers/`:
  1. **`findNearbyServices`** — Emergency & public services near an address (hospitals, police, fire, MDA, gas stations, banks, bus stops)
  2. **`getParcelInfo`** — Land registration data (gush/helka, neighborhood, statistical area) for a location
  3. **`findNearbyTourism`** — Tourism & recreation near an address (hotels, zimmers, attractions, wineries, archaeological sites, sports facilities)
  4. **`getLocationContext`** — Comprehensive area profile (neighborhood, statistical demographics, municipality info)
- Update govmap agent instructions with new layers section
- Update translations, source configs, routing hint
- Contract tests and API validation tests
- Update `GOVMAP_LAYERS` constants with new layer IDs

### Out of scope
- API token-gated endpoints (`spatial-analysis/layer-features-by-location`) — deferred until token acquired
- Interactive map embedding (future feature)
- New data source registration — tools are added within the existing `govmap` data source as a subfolder
- Census 2008 layers (data is 18 years old, low value)

## Impact Analysis

### New files
- `src/data-sources/govmap/api/layers/layers.client.ts` — entitiesByPoint + metadata client
- `src/data-sources/govmap/api/layers/layers.types.ts` — response types
- `src/data-sources/govmap/api/layers/layers.endpoints.ts` — URL builders
- `src/data-sources/govmap/api/layers/layers.constants.ts` — layer group definitions
- `src/data-sources/govmap/tools/layers/find-nearby-services.tool.ts`
- `src/data-sources/govmap/tools/layers/get-parcel-info.tool.ts`
- `src/data-sources/govmap/tools/layers/find-nearby-tourism.tool.ts`
- `src/data-sources/govmap/tools/layers/get-location-context.tool.ts`
- `src/data-sources/govmap/tools/layers/index.ts` — tool aggregation + source configs
- `src/data-sources/govmap/__tests__/govmap-layers-api-validation.test.ts`

### Modified files
- `src/data-sources/govmap/api/govmap.constants.ts` — add new layer ID constants
- `src/data-sources/govmap/tools/index.ts` — spread `LayersTools` into `GovmapTools`
- `src/data-sources/govmap/govmap.agent.ts` — expand instructions with layers section
- `src/data-sources/govmap/govmap.translations.tsx` — add 4 new tool translations
- `src/data-sources/govmap/index.ts` — update routing hint
- `src/data-sources/govmap/__tests__/govmap-data-source.test.ts` — update contract tests

### Files NOT modified
- No changes to registry, display types, CSS, or agent model config — this is a subfolder addition within an existing data source

## Technical Design

### Coordinate System
The `entitiesByPoint` endpoint uses **EPSG:3857 (Web Mercator)** coordinates, matching the existing autocomplete endpoint's output. The existing `parseCoordinatesFromShape()` extracts these coordinates from WKT POINT strings. No coordinate conversion needed.

### Tool Grouping Strategy
Rather than creating 20+ individual tools (one per layer), tools are grouped by user intent:
- **findNearbyServices**: Queries 7 service layers in one call → emergency, transport, financial
- **getParcelInfo**: Queries 3 land layers → parcel, block, neighborhood for property research
- **findNearbyTourism**: Queries 6 tourism layers → hotels, zimmers, attractions, wineries, archaeology, sports
- **getLocationContext**: Queries 3 context layers → neighborhood, statistical area, municipality

This matches how users naturally ask questions and keeps the agent's tool count manageable (11 total govmap tools instead of 25+).

### Multi-Layer Queries
The `entitiesByPoint` endpoint supports multiple layers per request. Each grouped tool sends a single HTTP request with all relevant layer IDs, reducing latency and rate limit pressure.

### Geocoding
All 4 tools accept a Hebrew address as input. They reuse the existing `nadlanApi.autocompleteAddress()` to geocode to EPSG:3857 coordinates before querying layers.

## Risks
- **Layer availability**: Some layers returned 0 entities in testing (MDA stations near Tel Aviv, nature reserves in urban areas). Mitigation: Tools document that results depend on location and layer coverage; empty results are not errors.
- **Field name instability**: GovMap may rename fields. Mitigation: API validation tests catch schema drift; metadata endpoint can refresh field mappings.
- **100-entity cap**: `entitiesByPoint` returns max 100 entities per layer. Mitigation: Sort by distance when `calculateDistance: true`; document the cap in tool output.
- **Origin header requirement**: The layers-catalog endpoints require `Origin: https://www.govmap.gov.il`. Mitigation: Add to shared client headers.

## Success Criteria
1. `tsc --noEmit` passes with zero errors
2. `npm run build` succeeds
3. Contract tests pass for all 4 new tools
4. API validation tests pass against live GovMap API
5. Dev server starts; querying "בתי חולים ליד דיזנגוף 50 תל אביב" returns hospital results
6. Agent routing correctly delegates location/services/tourism queries to govmap agent
