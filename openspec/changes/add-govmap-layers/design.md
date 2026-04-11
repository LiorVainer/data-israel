# Design: Add GovMap Map Layers

## Architecture Overview

This change adds a `layers/` sub-API and `layers/` tools subfolder within the existing `src/data-sources/govmap/` structure — following the same pattern used by `nadlan/`.

```
src/data-sources/govmap/
├── api/
│   ├── govmap.client.ts          # Shared (reused by layers)
│   ├── govmap.constants.ts       # Shared (extended with new layer IDs)
│   ├── govmap.endpoints.ts       # Shared (extended with layers-catalog paths)
│   ├── govmap.types.ts           # Shared (unchanged)
│   ├── nadlan/                   # Existing (unchanged)
│   └── layers/                   # NEW — layers-catalog API client
│       ├── layers.client.ts      # entitiesByPoint + metadata calls
│       ├── layers.types.ts       # Response types
│       ├── layers.endpoints.ts   # URL builders
│       └── layers.constants.ts   # Layer group definitions
├── tools/
│   ├── nadlan/                   # Existing (unchanged)
│   ├── layers/                   # NEW — 4 layer query tools
│   │   ├── find-nearby-services.tool.ts
│   │   ├── get-parcel-info.tool.ts
│   │   ├── find-nearby-tourism.tool.ts
│   │   ├── get-location-context.tool.ts
│   │   └── index.ts
│   └── index.ts                  # Modified: spread LayersTools
└── ...
```

## API Client Design

### layers.client.ts

```typescript
// Reuses govmapRequest from shared client
import { govmapRequest } from '../govmap.client';

// Two methods:
async function queryEntitiesByPoint(params: EntitiesByPointRequest): Promise<EntitiesByPointResponse>
async function getLayerMetadata(layerId: string): Promise<LayerMetadata | null>
```

### Key Request/Response Types

```typescript
interface EntitiesByPointRequest {
  point: [number, number];          // EPSG:3857
  layers: Array<{ layerId: string; filter?: string }>;
  tolerance: number;                // meters
  calculateDistance?: boolean;
  language?: 'he' | 'en';
}

interface EntityField {
  fieldName: string;
  fieldValue: string | null;
  fieldType: number;     // 1=text, 2=number, 8=date
  isVisible: boolean;
}

interface LayerEntity {
  objectId: number;
  centroid: [number, number];
  geom: string;           // WKT — stripped from output to save tokens
  fields: EntityField[];
  distance?: number;
}

interface LayerResult {
  name: string;
  caption: string;
  fieldsMapping: Record<string, string>;
  entities: LayerEntity[];
  layerId?: string;
}

interface EntitiesByPointResponse {
  data: LayerResult[];
}
```

## Tool Input/Output Design

### Common Input Pattern
All 4 tools share a common address-based input:

```typescript
const layerToolInput = z.object({
  address: z.string().describe('כתובת מלאה בעברית — רחוב + מספר + עיר'),
  radius: z.number().optional().default(2000).describe('רדיוס חיפוש במטרים'),
  ...commonToolInput,
});
```

### Common Output Pattern
All tools use `toolOutputSchema()` with cleaned entity data:

```typescript
// Strip WKT geom (huge tokens), keep only visible fields as key-value pairs
interface CleanEntity {
  name?: string;            // Primary name field
  address?: string;         // Address if available
  fields: Record<string, string>;  // All visible fields as flat object
  distance?: number;        // Meters from query point
}
```

### Tool-Specific Output

**findNearbyServices:**
```typescript
{
  address: string;
  radius: number;
  services: {
    hospitals: CleanEntity[];
    policeStations: CleanEntity[];
    fireStations: CleanEntity[];
    mdaStations: CleanEntity[];
    gasStations: CleanEntity[];
    banks: CleanEntity[];
    busStops: CleanEntity[];
  };
  totalFound: number;
}
```

**getParcelInfo:**
```typescript
{
  address: string;
  parcels: Array<{
    gushNum: string;
    parcel: string;
    gushSuffix?: string;
    legalArea?: string;
    status?: string;
    fields: Record<string, string>;
  }>;
  neighborhoods: Array<{ name: string; settlement: string }>;
  blocks: Array<{ gushNum: string; status?: string }>;
}
```

**findNearbyTourism:**
```typescript
{
  address: string;
  radius: number;
  tourism: {
    hotels: CleanEntity[];
    zimmers: CleanEntity[];
    attractions: CleanEntity[];
    wineries: CleanEntity[];
    archaeologicalSites: CleanEntity[];
    sportsFacilities: CleanEntity[];
  };
  totalFound: number;
}
```

**getLocationContext:**
```typescript
{
  address: string;
  neighborhood?: { name: string; settlement: string };
  statisticalArea?: {
    code: string;
    population?: string;
    district?: string;
    subDistrict?: string;
    naturalRegion?: string;
    mainReligion?: string;
    settlementType?: string;
    yearEstablished?: string;
  };
}
```

## Layer Group Constants

```typescript
// layers.constants.ts
export const SERVICE_LAYERS = [
  'Emergancy_Hospitals', 'POLICE_Yehida_Location', 'FIRE_STATIONS',
  'MADA_STATIONS', 'GASSTATIONS', 'banks', 'bus_stops',
] as const;

export const PARCEL_LAYERS = [
  'PARCEL_ALL', 'SUB_GUSH_ALL', 'Neighborhood',
] as const;

export const TOURISM_LAYERS = [
  'hotels', 'zimmer', 'atractions', 'winery',
  'atikot_sites_itm', 'sport',
] as const;

export const CONTEXT_LAYERS = [
  'Neighborhood', 'statistic_areas',
] as const;
```

## Geocoding Flow

```
User: "בתי חולים ליד דיזנגוף 50 תל אביב"
  ↓
1. Tool receives address = "דיזנגוף 50 תל אביב"
2. Call nadlanApi.autocompleteAddress(address)
3. Parse shape → EPSG:3857 coords [3873880, 3769003]
4. Call layersApi.queryEntitiesByPoint({
     point: [3873880, 3769003],
     layers: SERVICE_LAYERS.map(id => ({ layerId: id })),
     tolerance: 2000,
     calculateDistance: true,
   })
5. Clean results: strip geom, flatten fields, sort by distance
6. Return structured output with portalUrl
```

## Origin Header

The `layers-catalog` endpoints require `Origin: https://www.govmap.gov.il`. This must be added to the shared `govmapInstance` Axios headers in `govmap.client.ts` (affects all GovMap requests — the nadlan endpoints don't require it but accept it harmlessly).

## Agent Instructions Update

Add a new section to the govmap agent's Hebrew instructions covering:
- Available layer query tools and when to use each
- Address input requirements (same as nadlan)
- How to interpret multi-layer results
- When to suggest the portal URL for visual exploration
- That layer data is queried in real-time (not cached)
