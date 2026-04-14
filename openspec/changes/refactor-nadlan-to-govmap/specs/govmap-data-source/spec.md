# govmap-data-source Specification

## Purpose
Define the multi-layer GovMap data source structure that supports multiple geospatial layers (real estate, gas stations, parcels, municipal areas, etc.) through a shared infrastructure with entity-based subfolders.

## ADDED Requirements

### Requirement: GovMap Shared HTTP Client
The system SHALL provide a shared HTTP client (`govmap.client.ts`) that all GovMap layer clients inherit, containing axios instance configuration, rate limiting, retry logic, and concurrency control.

#### Scenario: Shared client used by nadlan layer
- **WHEN** the nadlan client makes API calls
- **THEN** it SHALL use `govmapRequest<T>()` from the shared client
- **AND** benefit from rate limiting (5 req/sec) and retry logic (3 retries, exponential backoff)

#### Scenario: New layer uses shared client
- **WHEN** a new GovMap layer client is created (e.g., gas stations)
- **THEN** it SHALL import `govmapRequest<T>()` from `govmap.client.ts`
- **AND** NOT duplicate rate limiting or retry infrastructure

### Requirement: GovMap Constants
The system SHALL define typed constants for all known GovMap layers, entity types, and geometry types in `govmap.constants.ts`.

#### Scenario: Layer constants
- **WHEN** code needs to reference a GovMap layer
- **THEN** it SHALL use `GOVMAP_LAYERS.NADLAN` (not string literal `'NADLAN'`)
- **AND** TypeScript SHALL infer the exact string literal type via `as const`

#### Scenario: Entity type constants
- **WHEN** code needs to reference a searchable entity type
- **THEN** it SHALL use `GOVMAP_ENTITY_TYPES.SETTLEMENT` (not string literal `'settlement'`)

#### Scenario: Constants are exhaustive
- **THEN** `GOVMAP_LAYERS` SHALL include at minimum: NADLAN, GAS_STATIONS, PARCEL_ALL, BUS_STOPS, HOSPITALS, HOTELS, NATURE_RESERVES
- **AND** `GOVMAP_ENTITY_TYPES` SHALL include all 12 types: settlement, neighborhood, street, address, parks, institutes, junction, block, parcel, ways, statistic, poi

### Requirement: GovMap Shared Types
The system SHALL extract platform-level types (AutocompleteResult, CoordinatePoint) into a shared `govmap.types.ts` that all layers can import.

#### Scenario: Shared types available to all layers
- **WHEN** a new layer needs address autocomplete results or coordinate handling
- **THEN** it SHALL import from `govmap.types.ts`
- **AND** NOT redefine these types locally

### Requirement: GovMap Shared URL Builders
The system SHALL provide shared URL builders (`buildGovmapUrl`, `buildGovmapPortalUrl`) in `govmap.endpoints.ts` that accept layer-agnostic parameters.

#### Scenario: Portal URL for any layer
- **WHEN** `buildGovmapPortalUrl(lon, lat, query)` is called
- **THEN** it SHALL return a URL with `c=lon,lat`, `z=6`, `lay=NADLAN` (or specified layer), and optional `q=query`

### Requirement: Entity-Based Subfolder Structure
The system SHALL organize layer-specific code into subfolders under `api/{layer}/` and `tools/{layer}/`.

#### Scenario: Nadlan layer subfolder
- **THEN** nadlan-specific API code SHALL reside in `api/nadlan/` (nadlan.client.ts, nadlan.types.ts, nadlan.endpoints.ts)
- **AND** nadlan tools SHALL reside in `tools/nadlan/` (8 tool files + index.ts)

#### Scenario: Adding a new layer
- **WHEN** a new GovMap layer is added (e.g., gas stations)
- **THEN** it SHALL only require new files in `api/gas-stations/` and `tools/gas-stations/`
- **AND** a spread in `tools/index.ts` to merge into `GovmapTools`
- **AND** NO modifications to shared infrastructure files

### Requirement: Tool Aggregation
The system SHALL aggregate tools from all layer subfolders into a single `GovmapTools` object via `tools/index.ts`.

#### Scenario: GovmapTools includes all nadlan tools
- **THEN** `GovmapTools` SHALL contain all 8 nadlan tools with their original IDs
- **AND** `GovmapToolName` SHALL be the union of all layer tool name types

#### Scenario: Source resolvers aggregated
- **THEN** `govmapSourceResolvers` SHALL merge resolvers from all layers
- **AND** each resolver SHALL be keyed by the original tool name

## MODIFIED Requirements

### Requirement: Data Source Identity
The data source identity SHALL change from `'nadlan'` to `'govmap'`.

#### Scenario: Data source ID
- **THEN** `GovmapDataSource.id` SHALL be `'govmap'`
- **AND** the `DataSource` type union SHALL include `'govmap'` instead of `'nadlan'`

#### Scenario: Agent identity
- **THEN** agent ID SHALL be `'govmapAgent'`
- **AND** agent name SHALL be `'סוכן GovMap'`

#### Scenario: CSS theming
- **THEN** CSS variables SHALL use `--badge-govmap` and `--badge-govmap-foreground`
- **AND** Tailwind classes SHALL reference `badge-govmap`

### Requirement: Tool ID Stability
All existing nadlan tool IDs SHALL remain unchanged to preserve conversation history.

#### Scenario: Tool IDs after refactor
- **THEN** all 8 tool IDs SHALL be identical to pre-refactor values
- **AND** `findRecentNadlanDeals`, `autocompleteNadlanAddress`, etc. SHALL NOT be renamed

## REMOVED Requirements

(none)
