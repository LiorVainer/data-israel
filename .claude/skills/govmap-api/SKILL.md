---
name: govmap-api
description: "This skill should be used when the user asks about 'GovMap layers', 'GovMap API', 'map layers', 'entitiesByPoint', 'layer metadata', 'govmap endpoints', 'what layers are available', 'query map data by location', or mentions adding new GovMap layer tools, querying geospatial data from govmap.gov.il, or extending the govmap data source with new layers. Provides the complete GovMap layers-catalog REST API reference, verified endpoint schemas, and the full catalog of 122 queryable government map layers with their field definitions."
---

# GovMap Layers-Catalog REST API

Complete reference for querying Israeli government map layers via the GovMap `layers-catalog` REST API. All endpoints verified working as of 2026-04-10.

## API Overview

GovMap exposes three REST API service prefixes. Only `layers-catalog` works without an API token:

| Service Prefix | Auth Required | Status |
|---|---|---|
| `/api/layers-catalog/*` | **No** (requires `Origin` header) | Primary — use this |
| `/api/search-service/*` | **No** | Already used by nadlan autocomplete |
| `/api/spatial-analysis/*` | **Yes** (domain-bound `apiToken`) | Requires registration at govmap.gov.il |

**Base URL:** `https://www.govmap.gov.il/api`

**Required header:** `Origin: https://www.govmap.gov.il` (for layers-catalog endpoints)

**Coordinate system:** All coordinates are **EPSG:3857 (Web Mercator)**, NOT ITM. The autocomplete endpoint returns shapes in this projection.

## Core Endpoints

### 1. `POST /api/layers-catalog/entitiesByPoint`

Query entities from one or more layers near a geographic point. **No API token required.**

**Request body:**
```json
{
  "point": [3873880, 3769003],
  "layers": [
    { "layerId": "GASSTATIONS" },
    { "layerId": "Neighborhood" },
    { "layerId": "PARCEL_ALL", "filter": "optional CQL filter" }
  ],
  "tolerance": 2000,
  "calculateDistance": true,
  "language": "he"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `point` | `[number, number]` | Yes | `[x, y]` in EPSG:3857 |
| `layers` | `Array<{layerId, filter?}>` | Yes | Layers to query |
| `tolerance` | `number` | Yes | Search radius in meters |
| `calculateDistance` | `boolean` | No | Include distance from point |
| `language` | `string` | No | `"he"` or `"en"` |

**Response:**
```json
{
  "data": [
    {
      "name": "gasstations",
      "caption": "תחנות דלק",
      "fieldsMapping": { "name": "שם", "company": "חברה" },
      "entities": [
        {
          "objectId": 123,
          "centroid": [3873500, 3769200],
          "geom": "POINT Z (...)",
          "fields": [
            { "fieldName": "שם", "fieldValue": "תל אביב", "fieldType": 1, "isVisible": true }
          ],
          "distance": 475.7
        }
      ],
      "dim": 2,
      "layerId": "42"
    }
  ]
}
```

**Key behaviors:**
- Multi-layer queries supported (pass multiple objects in `layers` array)
- Returns up to 100 entities per layer
- Empty `"data": []` means no features found within tolerance
- Layer IDs are **case-sensitive** (e.g., `GASSTATIONS` not `gasstations`)
- `fieldsMapping` maps internal field names to Hebrew display names
- `fieldType`: 1=text, 2=number, 8=date

### 2. `GET /api/layers-catalog/layer/{layerId}/metadata`

Get field definitions and source info for a layer. **No API token required.**

**Response:**
```json
{
  "description": {
    "name": "תחנות דלק",
    "source": "משרד האנרגיה",
    "description": "..."
  },
  "fields": {
    "name": "שם",
    "company": "חברה",
    "address": "כתובת",
    "city": "עיר"
  }
}
```

Returns `null` for layers that don't expose metadata.

### 3. `POST /api/spatial-analysis/layer-features-by-location` (Token Required)

More powerful than `entitiesByPoint` — supports WKT geometry (polygons, lines), not just points.

**Request body:**
```json
{
  "data": {
    "geometry": "POINT(179614.81 663968.73)",
    "radius": 500,
    "layers": [{ "name": "GASSTATIONS", "fields": ["name", "company"] }]
  },
  "apiToken": "your-domain-bound-token"
}
```

Requires both `apiToken` and `Origin` header matching the registered domain.

## Geocoding Workflow

To query layers by Hebrew address, first geocode via autocomplete (already implemented in nadlan client):

```
POST /api/search-service/autocomplete
{ "searchText": "דיזנגוף 50 תל אביב יפו" }
```

Returns `shape: "POINT(3873880 3769003)"` in EPSG:3857. Parse with `parseCoordinatesFromShape()` from `govmap.client.ts`, then pass to `entitiesByPoint`.

## Verified Layer Tiers

Layers tested and confirmed returning data via `entitiesByPoint` (5km tolerance, Tel Aviv center):

| Tier | Layer ID | Hebrew Name | Entities Found |
|---|---|---|---|
| **Tier 1** | `PARCEL_ALL` | חלקות | 100 |
| | `SUB_GUSH_ALL` | גושים | 100 |
| | `Neighborhood` | שכונות | 4 |
| | `statistic_areas` | אזורים סטטיסטיים | 100 |
| | `bus_stops` | תחנות אוטובוס | 100 |
| | `hotels` | בתי מלון | 93 |
| | `GASSTATIONS` | תחנות דלק | 55 |
| **Tier 2** | `POLICE_Yehida_Location` | תחנות משטרה | 9 |
| | `FIRE_STATIONS` | תחנות כיבוי | 6 |
| | `Emergancy_Hospitals` | בתי חולים | 3 |
| **Null metadata** | `shmurot_teva_ganim` | שמורות טבע | 0 |
| | `ganim_leumim` | גנים לאומיים | 0 |
| | `mitchmim_mshbsh` | התחדשות עירונית | 0 |
| | `activefaults` | שברים פעילים | 0 |

Layers returning `null` metadata may require different layer IDs or may not be queryable via this endpoint.

## Implementation in This Project

The existing govmap data source at `src/data-sources/govmap/` already has:
- Shared client infrastructure (`api/govmap.client.ts`) with rate limiting and retry
- Autocomplete geocoding (`/search-service/autocomplete`)
- Coordinate parsing (`parseCoordinatesFromShape`)
- Portal URL generation (`buildGovmapPortalUrl`)

New layer tools should follow the **subfolder pattern** (like `tools/nadlan/`):
1. Create `api/layers/` for the layers-catalog client methods
2. Create `tools/layers/` for the new tools
3. Spread new tools into the parent `tools/index.ts`
4. Update agent instructions, translations, and source configs

## Additional Resources

### Reference Files

- **`references/layers-catalog.md`** — Complete catalog of all 122 GovMap layers with IDs, Hebrew names, sources, and field schemas for every layer that exposes metadata
- **`references/api-endpoints.md`** — Detailed endpoint documentation including Zod schemas extracted from the GovMap JS bundle, response examples, error handling, and the `layer-features-by-location` (token-required) endpoint specification

### Existing Project Files

- `src/data-sources/govmap/api/govmap.client.ts` — Shared HTTP client (reuse for new tools)
- `src/data-sources/govmap/api/govmap.constants.ts` — Layer ID constants (extend with new layers)
- `src/data-sources/govmap/api/govmap.endpoints.ts` — URL builders (add layers-catalog paths)
- `src/data-sources/CLAUDE.md` — Data source architecture guide (subfolder pattern)
