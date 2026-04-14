/**
 * Shufersal API Endpoint Definitions
 *
 * Provides typed constants and URL builders for the Shufersal online store API.
 * Base URL: https://www.shufersal.co.il/online/he
 *
 * No authentication required. Requires `x-requested-with: XMLHttpRequest` header.
 */

// ============================================================================
// Base URL
// ============================================================================

/** Base URL for Shufersal online store */
export const SHUFERSAL_BASE_URL = 'https://www.shufersal.co.il/online/he';

// ============================================================================
// Search Path
// ============================================================================

/** Search endpoint path */
export const SHUFERSAL_SEARCH_PATH = '/search/results';

// ============================================================================
// URL Builder Functions
// ============================================================================

/**
 * Builds a Shufersal search API URL.
 *
 * @param query - The search query string
 * @param limit - Maximum number of results (default: 15)
 * @returns The fully constructed search URL
 *
 * @example
 * buildShufersalSearchUrl('חלב', 10)
 * // Returns: "https://www.shufersal.co.il/online/he/search/results?q=%D7%97%D7%9C%D7%91&limit=10"
 */
export function buildShufersalSearchUrl(query: string, limit: number = 15): string {
    const params = new URLSearchParams({
        q: query,
        limit: String(limit),
    });
    return `${SHUFERSAL_BASE_URL}${SHUFERSAL_SEARCH_PATH}?${params.toString()}`;
}

// ============================================================================
// Portal URL Builder (for source URL generation)
// ============================================================================

/** Shufersal main portal base URL */
export const SHUFERSAL_PORTAL_BASE_URL = 'https://www.shufersal.co.il/online/he';

/**
 * Builds a Shufersal portal URL for viewing search results.
 *
 * @param query - The search query string
 * @returns Human-readable search results URL
 */
export function buildSearchPortalUrl(query: string): string {
    const params = new URLSearchParams({ q: query });
    return `${SHUFERSAL_PORTAL_BASE_URL}${SHUFERSAL_SEARCH_PATH}?${params.toString()}`;
}
