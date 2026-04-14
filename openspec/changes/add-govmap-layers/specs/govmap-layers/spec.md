# GovMap Layers — Capability Spec

Specifies requirements for querying GovMap government map layers via the `layers-catalog/entitiesByPoint` REST endpoint.

**Related capabilities:** `agent-tools` (shared tool patterns)

---

## ADDED Requirements

### Requirement: Layers-Catalog API Client

The system SHALL provide a layers API client that queries the `POST /api/layers-catalog/entitiesByPoint` endpoint and `GET /api/layers-catalog/layer/{id}/metadata` endpoint, reusing the shared GovMap HTTP infrastructure (rate limiting, retries, concurrency).

#### Scenario: Successful multi-layer query
- **Given** valid EPSG:3857 coordinates and a list of layer IDs
- **When** `queryEntitiesByPoint` is called with tolerance in meters
- **Then** it returns an array of `LayerResult` objects, each containing entities with fields, centroids, and optional distances

#### Scenario: Empty results for location
- **Given** valid coordinates in an area with no matching features
- **When** `queryEntitiesByPoint` is called
- **Then** it returns `{ data: [] }` without throwing an error

#### Scenario: Origin header required
- **Given** the layers-catalog endpoint requires `Origin: https://www.govmap.gov.il`
- **When** the shared Axios instance sends any request
- **Then** the Origin header is included in all govmap requests

#### Scenario: Layer metadata retrieval
- **Given** a valid layer ID
- **When** `getLayerMetadata` is called
- **Then** it returns the field definitions and source info, or `null` for layers without public metadata

---

### Requirement: Find Nearby Services Tool

The system SHALL provide a tool that queries emergency and public service layers near a Hebrew address, returning grouped results sorted by distance.

#### Scenario: Search services near address
- **Given** a Hebrew address "דיזנגוף 50 תל אביב" and default radius (2000m)
- **When** `findNearbyServices` is called
- **Then** it geocodes the address, queries 7 service layers (hospitals, police, fire, MDA, gas stations, banks, bus stops), and returns results grouped by service type

#### Scenario: Custom radius
- **Given** a Hebrew address and radius of 5000 meters
- **When** `findNearbyServices` is called
- **Then** it queries layers with the specified tolerance, returning more results from a wider area

#### Scenario: Geocoding failure
- **Given** an unresolvable address string
- **When** `findNearbyServices` is called
- **Then** it returns an error result with `success: false` and a descriptive Hebrew error message

---

### Requirement: Get Parcel Info Tool

The system SHALL provide a tool that queries land registration layers (parcels, blocks, neighborhoods) for a location, returning property identification data.

#### Scenario: Get gush/helka for address
- **Given** a Hebrew address
- **When** `getParcelInfo` is called
- **Then** it returns parcel numbers (gush, helka, sub-gush), legal area in sqm, and status for parcels near the address

#### Scenario: Multiple parcels at location
- **Given** a point near several land parcels
- **When** `getParcelInfo` is called
- **Then** it returns all matching parcels sorted by distance, plus the neighborhood and block data for the closest match

---

### Requirement: Find Nearby Tourism Tool

The system SHALL provide a tool that queries tourism and recreation layers near a Hebrew address, returning grouped results.

#### Scenario: Search tourism near location
- **Given** a Hebrew address
- **When** `findNearbyTourism` is called with a radius
- **Then** it queries 6 tourism layers (hotels, zimmers, attractions, wineries, archaeological sites, sports facilities) and returns results grouped by category

#### Scenario: Tourism in non-urban area
- **Given** coordinates near a rural/nature area (e.g., Galilee)
- **When** `findNearbyTourism` is called with a large radius
- **Then** it returns zimmers, wineries, and nature attractions available in that region

---

### Requirement: Get Location Context Tool

The system SHALL provide a tool that generates a comprehensive area profile for a Hebrew address, combining neighborhood and statistical data.

#### Scenario: Full area profile
- **Given** a Hebrew address within a known settlement
- **When** `getLocationContext` is called
- **Then** it returns neighborhood name, statistical area code, population data, district, natural region, and settlement characteristics

#### Scenario: Address outside statistical coverage
- **Given** coordinates in an area without statistical zone data
- **When** `getLocationContext` is called
- **Then** it returns available data (neighborhood if found) with null for missing statistical fields

---

### Requirement: Entity Data Cleaning

All tools MUST clean raw API responses before returning to the agent, ensuring token efficiency and readability.

#### Scenario: WKT geometry stripped
- **Given** a raw entity with a large WKT `geom` field
- **When** the entity is cleaned for tool output
- **Then** the `geom` field is removed (saving tokens), while `centroid` coordinates are preserved

#### Scenario: Fields flattened to key-value pairs
- **Given** a raw entity with a `fields` array of `{fieldName, fieldValue, fieldType}` objects
- **When** the entity is cleaned
- **Then** fields are flattened to a `Record<string, string>` using Hebrew display names from `fieldsMapping`

#### Scenario: Output includes portal URL
- **Given** a successful tool query with coordinates
- **When** the tool result is returned
- **Then** it includes a `portalUrl` linking to govmap.gov.il with the relevant layers visible at the queried location
