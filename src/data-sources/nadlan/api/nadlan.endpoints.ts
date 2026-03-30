/**
 * Govmap Nadlan API Endpoint Definitions
 *
 * Provides typed constants and URL builders for the Govmap real estate API.
 * Base URL: https://www.govmap.gov.il/api/
 *
 * No authentication required. Rate limit: 5 requests/second.
 */

// ============================================================================
// Base URL
// ============================================================================

/** Base URL for Govmap API */
export const GOVMAP_BASE_URL = 'https://www.govmap.gov.il/api';

// ============================================================================
// Endpoint Path Constants
// ============================================================================

/** Govmap API endpoint paths */
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
// Type Definitions
// ============================================================================

/** Allowed Govmap path values */
export type GovmapPath = (typeof GOVMAP_PATHS)[keyof typeof GOVMAP_PATHS];

/** Parameter value types that can be serialized to URL query strings */
export type UrlParamValue = string | number | boolean | undefined | null;

/** Generic record type for URL parameters */
export type UrlParams = Record<string, UrlParamValue>;

// ============================================================================
// URL Builder Functions
// ============================================================================

/**
 * Builds a complete Govmap API URL from base, path, and optional query params.
 *
 * @param path - The endpoint path (may include dynamic segments)
 * @param params - Optional query parameters (undefined/null values are omitted)
 * @returns The fully constructed URL
 *
 * @example
 * buildGovmapUrl('/search-service/autocomplete')
 * // Returns: "https://www.govmap.gov.il/api/search-service/autocomplete"
 */
export function buildGovmapUrl(path: string, params?: UrlParams): string {
    const normalizedBase = GOVMAP_BASE_URL.endsWith('/') ? GOVMAP_BASE_URL.slice(0, -1) : GOVMAP_BASE_URL;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const fullUrl = `${normalizedBase}${normalizedPath}`;
    const url = new URL(fullUrl);

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        }
    }

    return url.toString();
}

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
// Portal URL Builder (for source URL generation)
// ============================================================================

/** Govmap Nadlan portal base URL */
export const GOVMAP_PORTAL_BASE_URL = 'https://www.govmap.gov.il';

/**
 * Govmap layer identifiers for the `lay` URL parameter.
 * @see https://api.govmap.gov.il/docs/url-functions/zoom-by-coordinates
 */
export const GOVMAP_LAYERS = {
    /** Real-estate transactions layer */
    NADLAN: 'NADLAN',
} as const;

/**
 * Builds a Govmap portal URL for viewing the Nadlan layer on the map.
 *
 * Coordinates use ITM (Israel Transverse Mercator / EPSG:2039) — govmap auto-detects
 * the projection from value ranges.
 *
 * @see https://api.govmap.gov.il/docs/url-functions/zoom-by-coordinates
 *
 * URL params:
 *  - c=X,Y  — center (ITM: X 100K–300K, Y 370K–810K)
 *  - z=6    — zoom level (0–10, 6 = neighbourhood)
 *  - lay=NADLAN — real-estate transactions layer
 */
export function buildGovmapPortalUrl(longitude?: number, latitude?: number, query?: string): string {
    const url = new URL(GOVMAP_PORTAL_BASE_URL);
    if (longitude !== undefined && latitude !== undefined) {
        url.searchParams.set('c', `${longitude},${latitude}`);
        url.searchParams.set('z', '6');
    }
    url.searchParams.set('lay', GOVMAP_LAYERS.NADLAN);
    if (query) {
        url.searchParams.set('q', query);
    }
    return url.toString();
}
