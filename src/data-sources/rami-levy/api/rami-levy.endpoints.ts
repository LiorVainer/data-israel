/**
 * Rami Levy Catalog API Endpoint Definitions
 *
 * Provides typed constants and URL builders for the Rami Levy product catalog API.
 * Base URL: https://www.rami-levy.co.il
 *
 * No authentication required.
 */

// ============================================================================
// Base URL
// ============================================================================

/** Base URL for Rami Levy website */
export const RAMI_LEVY_BASE_URL = 'https://www.rami-levy.co.il';

/** Catalog search endpoint path */
export const RAMI_LEVY_CATALOG_PATH = '/api/catalog';

/** Default store ID (Rami Levy branch 331) */
export const RAMI_LEVY_DEFAULT_STORE_ID = '331';

// ============================================================================
// Portal URL Builders
// ============================================================================

/** Rami Levy portal base URL */
export const RAMI_LEVY_PORTAL_BASE_URL = 'https://www.rami-levy.co.il';

/**
 * Builds a Rami Levy portal URL for a product search.
 */
export function buildSearchPortalUrl(query: string): string {
    return `${RAMI_LEVY_PORTAL_BASE_URL}/he/online/search?q=${encodeURIComponent(query)}`;
}

/**
 * Builds a Rami Levy portal URL for a specific product by ID.
 */
export function buildProductPortalUrl(productId: string | number): string {
    return `${RAMI_LEVY_PORTAL_BASE_URL}/he/online/product/${productId}`;
}

/**
 * Builds a general Rami Levy portal URL.
 */
export function buildRamiLevyPortalUrl(): string {
    return RAMI_LEVY_PORTAL_BASE_URL;
}
