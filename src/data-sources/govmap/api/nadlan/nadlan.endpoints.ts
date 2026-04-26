/**
 * Nadlan (Real Estate) Endpoint Definitions
 *
 * Nadlan-specific API paths and URL builders.
 * Shared infrastructure (base URL, buildGovmapUrl) lives in ../govmap.endpoints.
 */

import { buildGovmapUrl, buildGovmapPortalUrl as buildPortalUrlBase, type UrlParams } from '../govmap.endpoints';
import { GOVMAP_LAYERS } from '../govmap.constants';

// Re-export shared constants for convenience
export { GOVMAP_LAYERS } from '../govmap.constants';

// ============================================================================
// Endpoint Path Constants
// ============================================================================

/** Nadlan-specific API endpoint paths (all under /real-estate/*) */
export const GOVMAP_PATHS = {
    /** Address autocomplete search */
    AUTOCOMPLETE: '/search-service/autocomplete',
    /**
     * Get polygon metadata within a radius of coordinates.
     * Dynamic path: /real-estate/deals/{lon},{lat}/{radius}
     */
    DEALS_BY_RADIUS: '/real-estate/deals',
    /**
     * Get deals for a specific street polygon.
     * Dynamic path: /real-estate/street-deals/{polygonId}
     */
    STREET_DEALS: '/real-estate/street-deals',
    /**
     * Get deals for a specific neighborhood polygon.
     * Dynamic path: /real-estate/neighborhood-deals/{polygonId}
     */
    NEIGHBORHOOD_DEALS: '/real-estate/neighborhood-deals',
} as const;

// ============================================================================
// URL Builder Functions
// ============================================================================

/**
 * Builds a deals-by-radius URL with coordinates and radius in the path.
 *
 * @example
 * buildDealsByRadiusUrl(34.78, 32.07, 500)
 * // Returns: "https://www.govmap.gov.il/api/real-estate/deals/34.78,32.07/500"
 */
export function buildDealsByRadiusUrl(longitude: number, latitude: number, radius: number): string {
    return buildGovmapUrl(`${GOVMAP_PATHS.DEALS_BY_RADIUS}/${longitude},${latitude}/${radius}`);
}

/**
 * Builds a street deals URL with polygon ID in the path.
 *
 * @example
 * buildStreetDealsUrl('abc123', { limit: 50, dealType: 2 })
 */
export function buildStreetDealsUrl(polygonId: string, params?: UrlParams): string {
    return buildGovmapUrl(`${GOVMAP_PATHS.STREET_DEALS}/${encodeURIComponent(polygonId)}`, params);
}

/**
 * Builds a neighborhood deals URL with polygon ID in the path.
 */
export function buildNeighborhoodDealsUrl(polygonId: string, params?: UrlParams): string {
    return buildGovmapUrl(`${GOVMAP_PATHS.NEIGHBORHOOD_DEALS}/${encodeURIComponent(polygonId)}`, params);
}

// ============================================================================
// Portal URL Builder (Nadlan-specific)
// ============================================================================

/**
 * Builds a GovMap portal URL for viewing the Nadlan layer on the map.
 *
 * Wraps the shared buildGovmapPortalUrl with the NADLAN layer hardcoded.
 *
 * @param longitude - ITM X coordinate
 * @param latitude - ITM Y coordinate
 * @param query - Optional search query
 */
export function buildNadlanPortalUrl(longitude?: number, latitude?: number, query?: string): string {
    return buildPortalUrlBase(longitude, latitude, query, GOVMAP_LAYERS.NADLAN);
}
