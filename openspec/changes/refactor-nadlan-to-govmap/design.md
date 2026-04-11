# Design: Refactor Nadlan to Multi-Layer GovMap

## Architecture Overview

### Current State
```
src/data-sources/nadlan/
├── api/
│   ├── nadlan.client.ts       # Mixed: shared HTTP infra + nadlan business logic
│   ├── nadlan.endpoints.ts    # Mixed: shared URL builders + nadlan-specific paths
│   └── nadlan.types.ts        # Mixed: shared types + nadlan-specific types
├── tools/                     # Flat: all 8 nadlan tools
├── nadlan.agent.ts            # Single-layer agent
├── nadlan.display.ts
├── nadlan.translations.tsx
└── index.ts                   # DataSource id: 'nadlan'
```

### Target State
```
src/data-sources/govmap/
├── api/
│   ├── govmap.client.ts           # SHARED: axios, rate limit, retry, govmapRequest<T>()
│   ├── govmap.endpoints.ts        # SHARED: GOVMAP_BASE_URL, buildGovmapUrl(), buildGovmapPortalUrl()
│   ├── govmap.constants.ts        # SHARED: layer IDs, entity types, geometry types
│   ├── govmap.types.ts            # SHARED: AutocompleteResult, CoordinatePoint
│   └── nadlan/
│       ├── nadlan.client.ts       # LAYER: nadlanApi, cleanDeals, computeStatistics
│       ├── nadlan.endpoints.ts    # LAYER: /real-estate/* path constants
│       └── nadlan.types.ts        # LAYER: Deal, RawDeal, PolygonMetadata, DealStatistics
├── tools/
│   ├── nadlan/
│   │   ├── *.tool.ts              # All 8 existing tools (IDs unchanged)
│   │   └── index.ts               # NadlanTools, NadlanToolName, nadlanSourceResolvers
│   └── index.ts                   # GovmapTools = { ...NadlanTools }, aggregated resolvers
├── __tests__/
│   └── govmap-data-source.test.ts
├── govmap.agent.ts                # Multi-layer agent with sectioned instructions
├── govmap.display.ts              # badge-govmap CSS, label "GovMap"
├── govmap.translations.tsx        # All tool translations aggregated
└── index.ts                       # GovmapDataSource, id: 'govmap'
```

## Key Design Decisions

### 1. Shared vs Layer-Specific Split

The current `nadlan.client.ts` contains two distinct concerns:

**Shared GovMap infrastructure** (→ `govmap.client.ts`):
- Axios instance with base URL `https://www.govmap.gov.il/api`
- Rate limiter (5 req/sec, 200ms intervals)
- Retry logic (3 retries, exponential backoff for 5xx errors)
- Concurrency limiter (`pLimit(5)`)
- Generic `govmapRequest<T>(config)` function
- `parseCoordinatesFromShape(shape)` — shared WKT POINT parser

**Nadlan-specific business logic** (→ `api/nadlan/nadlan.client.ts`):
- `nadlanApi.autocompleteAddress()` — address search (shared endpoint, but nadlan-specific orchestration)
- `nadlanApi.getDealsByRadius()` — polygon metadata
- `nadlanApi.getStreetDeals()` / `getNeighborhoodDeals()` — deal data
- `nadlanApi.findRecentDealsForAddress()` — composite orchestration
- `cleanDeals()` — strips bloat fields, computes price/sqm
- `computeStatistics()` — mean/min/max/median calculations

**Decision**: `autocompleteAddress` stays in the nadlan client because its response parsing is coupled to the nadlan workflow (finding coordinates for deal searches). Future layers needing autocomplete will either call the shared `govmapRequest` directly or extract it later if a pattern emerges.

### 2. Constants Design (`govmap.constants.ts`)

Typed const objects (not TypeScript enums) for tree-shaking:

```typescript
export const GOVMAP_LAYERS = {
    NADLAN: 'NADLAN',
    GAS_STATIONS: 'GASSTATIONS',
    PARCEL_ALL: 'PARCEL_ALL',
    BUS_STOPS: 'bus_stops',
    HOSPITALS: 'Hospitals',
    HOTELS: 'hotels',
    NATURE_RESERVES: 'nature_reserves',
    // ... comprehensive list from API docs
} as const;
export type GovmapLayer = (typeof GOVMAP_LAYERS)[keyof typeof GOVMAP_LAYERS];

export const GOVMAP_ENTITY_TYPES = {
    SETTLEMENT: 'settlement',
    NEIGHBORHOOD: 'neighborhood',
    STREET: 'street',
    ADDRESS: 'address',
    PARKS: 'parks',
    INSTITUTES: 'institutes',
    JUNCTION: 'junction',
    BLOCK: 'block',
    PARCEL: 'parcel',
    WAYS: 'ways',
    STATISTIC: 'statistic',
    POI: 'poi',
} as const;
export type GovmapEntityType = (typeof GOVMAP_ENTITY_TYPES)[keyof typeof GOVMAP_ENTITY_TYPES];

export const GOVMAP_GEOMETRY_TYPES = {
    POINT: 0,
    POLYLINE: 1,
    POLYGON: 2,
    LINE: 3,
    CIRCLE: 4,
} as const;
export type GovmapGeometryType = (typeof GOVMAP_GEOMETRY_TYPES)[keyof typeof GOVMAP_GEOMETRY_TYPES];
```

### 3. Tool ID Stability

All 8 nadlan tool IDs remain unchanged:
- `autocompleteNadlanAddress`
- `findRecentNadlanDeals`
- `getStreetNadlanDeals`
- `getNeighborhoodNadlanDeals`
- `getNadlanValuationComparables`
- `getNadlanMarketActivity`
- `getNadlanDealStatistics`
- `generateNadlanSourceUrl`

These IDs are persisted in Mastra memory (conversation history) and changing them would break recall of past tool calls. Future layers will use their own prefixes (e.g., `searchGovmapGasStations`).

### 4. Agent Evolution

The agent expands from nadlan-only to multi-layer:

**Agent ID**: `govmapAgent` (was `nadlanAgent`)
**Agent Name**: `סוכן GovMap` (was `סוכן נדל"ן`)

Instructions structured in sections:
```
=== כללי GovMap ===
[shared: coordinate system, search entities, portal URLs]

=== נדל"ן (Real Estate) ===
[existing nadlan instructions, nearly unchanged]

=== שכבות נוספות (Future) ===
[placeholder for new layers as they're added]
```

### 5. Data Source ID Cascade

Changing `'nadlan'` → `'govmap'` touches:

| Location | Change |
|----------|--------|
| `display.types.ts` DataSource union | `'nadlan'` → `'govmap'` |
| `registry.ts` meta entry | `id: 'govmap'`, imports from `./govmap` |
| `registry.server.ts` | Import `GovmapDataSource` |
| `model.ts` SubAgentId | `'nadlan'` → `'govmap'` |
| `agent.config.ts` | `NADLAN_ID` → `GOVMAP_ID` |
| `SourcesPart.tsx` | Key `'govmap'`, CSS classes `badge-govmap` |
| `globals.css` | `--badge-nadlan` → `--badge-govmap` (6 lines) |
| `CLAUDE.md` files | Documentation updates |

### 6. Future Layer Addition Pattern

Adding a new layer (e.g., gas stations) requires:

1. Create `api/gas-stations/` with client, types, endpoints
2. Create `tools/gas-stations/` with tool files + index.ts
3. In `tools/index.ts`: spread `...GasStationTools` into `GovmapTools`
4. In `govmap.translations.tsx`: add gas station tool translations
5. In `govmap.agent.ts`: add gas stations instruction section
6. Update contract tests

No changes needed to shared infrastructure, registry, or external files.
