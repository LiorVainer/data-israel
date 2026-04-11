/**
 * GovMap Shared Endpoint Definitions
 *
 * Provides base URL constants and generic URL builders for any GovMap API layer.
 * Layer-specific paths and URL builders live in their own subfolders.
 */

// ============================================================================
// Base URLs
// ============================================================================

/** Base URL for GovMap API */
export const GOVMAP_BASE_URL = 'https://www.govmap.gov.il/api';

/** GovMap portal base URL (for source URL generation) */
export const GOVMAP_PORTAL_BASE_URL = 'https://www.govmap.gov.il';

// ============================================================================
// Type Definitions
// ============================================================================

/** Parameter value types that can be serialized to URL query strings */
export type UrlParamValue = string | number | boolean | undefined | null;

/** Generic record type for URL parameters */
export type UrlParams = Record<string, UrlParamValue>;

/** Allowed GovMap path values (string-based, layers define their own subsets) */
export type GovmapPath = string;

// ============================================================================
// Layers-Catalog Paths
// ============================================================================

export const GOVMAP_LAYERS_CATALOG_PATHS = {
    ENTITIES_BY_POINT: '/layers-catalog/entitiesByPoint',
    LAYER_METADATA: '/layers-catalog/layer',
} as const;

/**
 * Builds the metadata URL for a specific layer.
 *
 * @param layerId - Layer identifier (case-sensitive)
 * @returns Full URL for the layer metadata endpoint
 */
export function buildLayerMetadataUrl(layerId: string): string {
    return buildGovmapUrl(`${GOVMAP_LAYERS_CATALOG_PATHS.LAYER_METADATA}/${encodeURIComponent(layerId)}/metadata`);
}

// ============================================================================
// URL Builder Functions
// ============================================================================

/**
 * Builds a complete GovMap API URL from base, path, and optional query params.
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
 * Builds a GovMap portal URL for viewing a layer on the map.
 *
 * Coordinates use ITM (Israel Transverse Mercator / EPSG:2039) — govmap auto-detects
 * the projection from value ranges.
 *
 * @see https://api.govmap.gov.il/docs/url-functions/zoom-by-coordinates
 *
 * URL params:
 *  - c=X,Y  — center (ITM: X 100K-300K, Y 370K-810K)
 *  - z=6    — zoom level (0-10, 6 = neighbourhood)
 *  - lay=LAYER — layer identifier
 */
export function buildGovmapPortalUrl(
    longitude?: number,
    latitude?: number,
    query?: string,
    layers?: string | readonly string[],
): string {
    const url = new URL(GOVMAP_PORTAL_BASE_URL);
    if (longitude !== undefined && latitude !== undefined) {
        url.searchParams.set('c', `${longitude},${latitude}`);
        url.searchParams.set('z', '6');
    }
    if (layers) {
        const layerStr = typeof layers === 'string' ? layers : layers.join(',');
        if (layerStr) {
            url.searchParams.set('lay', layerStr);
        }
    }
    if (query) {
        url.searchParams.set('q', query);
    }
    return url.toString();
}
