/**
 * Nadlan (Real Estate) API Types
 *
 * Type definitions for Nadlan-specific API response shapes.
 * Shared types (AutocompleteResult, CoordinatePoint, etc.) live in ../govmap.types.
 */

// ============================================================================
// Deals
// ============================================================================

/** Raw deal record from the Govmap API */
export interface RawDeal {
    objectid: number;
    /** Transaction amount in NIS */
    dealAmount: number;
    /** Transaction date (ISO string) */
    dealDate: string;
    /** Property area in square meters */
    assetArea?: number;
    /** City name in Hebrew */
    settlementNameHeb?: string;
    /** City name in English */
    settlementNameEng?: string;
    /** Property type description */
    propertyTypeDescription?: string;
    /** Neighborhood name */
    neighborhood?: string;
    /** Street name */
    streetName?: string;
    /** Street name in Hebrew */
    streetNameHeb?: string;
    /** Street name in English */
    streetNameEng?: string;
    /** House number */
    houseNumber?: string;
    /** Floor description (may be Hebrew text) */
    floor?: string;
    /** Numeric floor number */
    floorNumber?: number;
    /** Number of rooms */
    assetRoomNum?: number;
    /** Asset type in Hebrew */
    assetTypeHeb?: string;
    /** Asset type in English */
    assetTypeEng?: string;
    /** WKT geometry (usually MULTIPOLYGON) — large, stripped before returning */
    shape?: string;
    /** Source polygon ID */
    sourcePolygonId?: string;
    /** Source ordering */
    sourceorder?: number;
    /** Priority for sorting */
    priority?: number;
    /** Internal deal ID */
    dealId?: number;
    /** Internal polygon ID */
    polygonId?: string;
    /** Settlement ID */
    settlementId?: string;
    /** Street code */
    streetCode?: string;
}

/** Cleaned deal record with computed fields */
export interface Deal {
    /** Sequential ID for LLM reference */
    id: number;
    /** Transaction amount in NIS */
    dealAmount: number;
    /** Transaction date (ISO string) */
    dealDate: string;
    /** Property area in sqm */
    assetArea?: number;
    /** Calculated price per sqm in NIS */
    pricePerSqm?: number;
    /** Settlement/city name */
    settlementName?: string;
    /** Street name */
    streetName?: string;
    /** House number */
    houseNumber?: string;
    /** Property type */
    assetType?: string;
    /** Neighborhood name */
    neighborhood?: string;
    /** Floor description */
    floor?: string;
    /** Numeric floor */
    floorNumber?: number;
    /** Number of rooms */
    rooms?: number;
    /** Deal source category: same_building, street, neighborhood */
    dealSource?: string;
}

/** Response from street-deals and neighborhood-deals endpoints */
export interface DealsResponse {
    data: RawDeal[];
    totalCount: number;
    limit: number;
    offset: number;
}

// ============================================================================
// Polygon Metadata (from deals-by-radius)
// ============================================================================

/** Polygon metadata returned by the deals-by-radius endpoint */
export interface PolygonMetadata {
    /** Number of deals in this polygon */
    dealscount: number;
    /** Polygon identifier */
    polygon_id: string;
    /** Settlement name in Hebrew */
    settlementNameHeb?: string;
    /** Street name in Hebrew */
    streetNameHeb?: string;
    /** House number */
    houseNum?: string;
    /** Internal object ID */
    objectid?: number;
}

// ============================================================================
// Statistics
// ============================================================================

/** Aggregated deal statistics */
export interface DealStatistics {
    /** Total number of deals */
    totalDeals: number;
    /** Price statistics in NIS */
    priceStats?: {
        mean: number;
        min: number;
        max: number;
        median: number;
    };
    /** Area statistics in sqm */
    areaStats?: {
        mean: number;
        min: number;
        max: number;
    };
    /** Price per sqm statistics in NIS */
    pricePerSqmStats?: {
        mean: number;
        min: number;
        max: number;
        median: number;
    };
}

/** Deal type filter values */
export type DealType = 1 | 2;

/** Deal type labels */
export const DEAL_TYPE_LABELS: Record<DealType, string> = {
    1: 'יד ראשונה (חדש)',
    2: 'יד שנייה (משומש)',
};
