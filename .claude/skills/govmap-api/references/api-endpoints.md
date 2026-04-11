# GovMap API Endpoints — Detailed Reference

Complete endpoint documentation for the GovMap REST API, including Zod schemas extracted from the production JS bundle (`govmap.api.js`).

## Service Architecture

GovMap's frontend is a Vite SPA that communicates with three backend service prefixes, configured via environment variables:

| Vite Env Var | Default Value | Purpose |
|---|---|---|
| `VITE_GENERAL_SEARCH_SERVICE_PATH_URL` | `search-service` | Address search + autocomplete |
| `VITE_GENERAL_CATALOG_SERVICE_PATH_URL` | `layers-catalog` | Layer catalog, metadata, entity queries |
| `VITE_GENERAL_SPATIAL_ANALYSIS_SERVICE_PREFIX_PATH_URL` | `spatial-analysis` | Spatial analysis (token-gated) |

All services share the base URL: `https://www.govmap.gov.il/api`

---

## layers-catalog Service (No Token Required)

### POST `/api/layers-catalog/entitiesByPoint`

**Zod schema (extracted from JS bundle):**
```typescript
const requestSchema = z.object({
  point: z.array(z.number()),           // [x, y] in EPSG:3857
  layers: z.array(z.object({
    layerId: z.string(),                // Required — layer identifier
    filter: z.string().optional(),      // Optional CQL filter expression
  })),
  tolerance: z.number(),               // Search radius in meters
  language: z.string().optional(),      // "he" or "en"
  calculateDistance: z.boolean().default(false),
});
```

**Response Zod schema (extracted):**
```typescript
const entitySchema = z.object({
  objectId: z.number(),
  centroid: z.array(z.number()),        // [x, y] in EPSG:3857
  editEntities: z.boolean().optional(),
  geom: z.string().min(1),             // WKT geometry string
  fields: z.array(z.object({
    fieldName: z.string(),
    fieldDisplay: z.string().optional(),
    fieldValue: z.string().nullable(),
    fieldType: z.number(),             // 1=text, 2=number, 3=check, 8=date
    isVisible: z.boolean().optional(),
  })),
  distance: z.number().optional(),     // Distance from query point (meters)
});

const layerResultSchema = z.object({
  name: z.string(),                    // Layer technical name
  caption: z.string(),                 // Hebrew display name
  fieldsMapping: z.record(z.string(), z.string()).optional(),
  entities: z.array(entitySchema),
  style: z.object({
    name: z.string(),
    rules: z.array(z.any()),
  }).optional(),
  dim: z.number().nullable().optional(),
  layerId: z.string().optional(),
});

const responseSchema = z.object({
  data: z.array(layerResultSchema),
});
```

**Field types enum:**
```typescript
enum FieldType {
  text = 1,
  number = 2,
  check = 3,
  multiChoice = 4,
  link = 5,
  picture = 6,
  hoursTime = 7,
  date = 8,
  wkt = 9,
  x = 10,
  y = 11,
}
```

**Important behaviors:**
- Returns max 100 entities per layer per query
- `fields` array includes only fields marked `isVisible: true` by default
- `fieldsMapping` maps technical field names → Hebrew display names
- `geom` contains full WKT geometry (can be very large for polygons like parcels)
- Coordinates in both `centroid` and `geom` are EPSG:3857
- Empty `data: []` when no features found (not an error)
- Layer IDs are case-sensitive

**Error responses:**
- `400` — Zod validation error (missing required fields)
- `400` — `{"message": "Missing Origin header in request"}` if no Origin header
- The endpoint does NOT return 401/403 — no token needed

**Example — multi-layer query:**
```bash
curl -X POST "https://www.govmap.gov.il/api/layers-catalog/entitiesByPoint" \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.govmap.gov.il" \
  -d '{
    "point": [3873880, 3769003],
    "layers": [
      {"layerId": "GASSTATIONS"},
      {"layerId": "Neighborhood"},
      {"layerId": "PARCEL_ALL"}
    ],
    "tolerance": 2000,
    "calculateDistance": true
  }'
```

---

### GET `/api/layers-catalog/layer/{layerId}/metadata`

**Response schema:**
```typescript
const metadataSchema = z.object({
  description: z.record(z.string(), z.any()),
  fields: z.record(z.string(), z.any()),  // field_name → Hebrew display name
});
```

Returns `null` (not 404) for layers without public metadata.

**Example:**
```bash
curl "https://www.govmap.gov.il/api/layers-catalog/layer/GASSTATIONS/metadata" \
  -H "Origin: https://www.govmap.gov.il"

# Response:
{
  "description": {
    "date": "03/19/2026",
    "name": "תחנות דלק",
    "description": ""
  },
  "fields": {
    "x": "x", "y": "y",
    "value0": "מזהה",
    "value1": "חברה",
    "value2": "כתובת",
    "value3": "שם",
    "value4": "עיר",
    "value5": "אזור"
  }
}
```

---

### POST `/api/layers-catalog/layers/extent`

Get the geographic extent (bounding box) of filtered layers.

**Request:** Layer filter configuration (not fully documented)
**Response:** Bounding box coordinates

---

### GET `/api/layers-catalog/layer/{layerId}/filter/fields?language=he`

Get filterable fields for a layer.

---

### GET `/api/layers-catalog/layer/{layerId}/filter/{fieldName}/autocomplete?q={query}`

Autocomplete values within a layer's field.

---

## search-service (No Token Required)

### POST `/api/search-service/autocomplete`

Already implemented in `src/data-sources/govmap/api/nadlan/nadlan.client.ts`.

**Request schema:**
```typescript
const searchSchema = z.object({
  searchText: z.string(),
  language: z.nativeEnum({ he: 'he', en: 'en' }).optional(),
  filterType: z.string().optional(),        // e.g., "address", "transportation"
  aggregationFilterType: z.string().optional(),
  maxResults: z.number().optional(),
  isAccurate: z.boolean().optional(),
  apiKey: z.string().optional(),            // Optional for basic search
});
```

**Response schema:**
```typescript
const searchResultSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.string(),         // "address", "transportation", "parcel", etc.
  score: z.number(),
  shape: z.string().optional(),  // WKT in EPSG:3857
  data: z.any(),
  originalText: z.string().optional(),
  layerId: z.string().or(z.number()).optional(),
  objectId: z.string().or(z.number()).optional(),
});

const responseSchema = z.object({
  resultsCount: z.number(),
  results: z.array(searchResultSchema),
  aggregations: z.array(z.object({
    key: z.string(),     // "address", "parcel", "transportation", etc.
    count: z.number(),
  })),
});
```

**Searchable entity types (from search engine appendix):**
- `settlement` — settlements/cities
- `neighborhood` — neighborhoods
- `street` — streets
- `address` — full addresses
- `parks` — parks
- `institutes` — institutions
- `junction` — road junctions
- `block` — land registration blocks
- `parcel` — land parcels
- `ways` — roads/paths
- `statistic` — statistical zones
- `poi` — points of interest

---

## spatial-analysis Service (Token Required)

### POST `/api/spatial-analysis/layer-features-by-location`

**Request schema (from JS bundle):**
```typescript
// Called via: Ss.post(`${A1}/layer-features-by-location`, { data, apiToken })
const requestSchema = z.object({
  data: z.object({
    geometry: z.string(),  // WKT geometry (POINT, POLYGON, etc.)
    radius: z.number(),
    layers: z.array(z.object({
      name: z.string(),
      fields: z.array(z.string()),
    })),
  }),
  apiToken: z.string(),  // Domain-bound API token from govmap.gov.il
});
```

**Error responses:**
- `400` — `{"message": "Missing Origin header in request"}`
- `401` — `{"message": "Invalid API token or unauthorized domain"}`

**Getting an API token:**
1. Log in to govmap.gov.il
2. Go to user menu → "ניהול API"
3. Click "בקשה חדשה" (new request)
4. Enter domain(s) and usage description
5. Submit — token is issued after review

**Advantages over entitiesByPoint:**
- Supports WKT geometry (POLYGON, LINESTRING), not just points
- Can specify which fields to return (reduces payload)
- More flexible spatial queries

---

## Coordinate Systems

**EPSG:3857 (Web Mercator)** — Used by all layers-catalog and search-service endpoints.
- X range for Israel: ~3,850,000 – 3,950,000
- Y range for Israel: ~3,700,000 – 3,900,000

**ITM (Israel Transverse Mercator / EPSG:2039)** — Used by some layer field values (e.g., `x_itm`, `y_itm` fields in police stations).
- X range: ~100,000 – 300,000
- Y range: ~370,000 – 810,000

**Portal URL coordinates** — The govmap.gov.il portal auto-detects projection from value ranges:
- If X is 100K-300K → ITM
- If X is 4-36 → WGS84

The `buildGovmapPortalUrl()` function in `govmap.endpoints.ts` uses ITM coordinates for portal links.

---

## Rate Limiting

The existing govmap client (`govmap.client.ts`) enforces:
- Max 5 concurrent requests (`p-limit`)
- Min 200ms between requests (5 req/s)
- 3 retries with exponential backoff for 500/502/503/504

These limits should be respected for layers-catalog endpoints as well.
