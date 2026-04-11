/**
 * GovMap Shared Constants
 *
 * Typed const objects for GovMap layer identifiers, entity types,
 * and geometry types. Used across all GovMap-based data sources.
 */

// ============================================================================
// Layer Identifiers
// ============================================================================

/**
 * GovMap layer identifiers for the `lay` URL parameter.
 * @see https://api.govmap.gov.il/docs/url-functions/zoom-by-coordinates
 */
export const GOVMAP_LAYERS = {
    NADLAN: 'NADLAN',
    GAS_STATIONS: 'GASSTATIONS',
    PARCEL_ALL: 'PARCEL_ALL',
    PARCEL_HOKS: 'PARCEL_HOKS',
    BUS_STOPS: 'bus_stops',
    HOSPITALS: 'Hospitals',
    NATURE_RESERVES: 'nature_reserves',
    HOTELS: 'hotels',
    FORESTS: 'forests',
    QUARRIES: 'quarries',
    FIRE_STATIONS: 'fire_stations',
    POLICE_STATIONS: 'police_stations',
} as const;

export type GovmapLayer = (typeof GOVMAP_LAYERS)[keyof typeof GOVMAP_LAYERS];

// ============================================================================
// Entity Types
// ============================================================================

/** GovMap entity types for autocomplete and search classification */
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

// ============================================================================
// Geometry Types
// ============================================================================

/** GovMap geometry type codes used in spatial queries */
export const GOVMAP_GEOMETRY_TYPES = {
    POINT: 0,
    POLYLINE: 1,
    POLYGON: 2,
    LINE: 3,
    CIRCLE: 4,
} as const;

export type GovmapGeometryType = (typeof GOVMAP_GEOMETRY_TYPES)[keyof typeof GOVMAP_GEOMETRY_TYPES];
