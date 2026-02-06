/**
 * CBS (Central Bureau of Statistics) API Endpoint Definitions
 *
 * Provides typed constants and URL builders for 3 CBS sub-APIs:
 * - Series API: Statistical time series catalog and data
 * - Price Index API: CPI and price index data
 * - Dictionary API: Geographic and classification lookups
 */

// ============================================================================
// Base URLs
// ============================================================================

/** Base URL for CBS Series API */
export const CBS_SERIES_BASE_URL = 'https://apis.cbs.gov.il/series';

/** Base URL for CBS Price Index API */
export const CBS_PRICE_INDEX_BASE_URL = 'https://api.cbs.gov.il/index';

/** Base URL for CBS Dictionary API */
export const CBS_DICTIONARY_BASE_URL = 'https://api.cbs.gov.il/dictionary';

// ============================================================================
// Endpoint Path Constants
// ============================================================================

/** Series API endpoint paths */
export const CBS_SERIES_PATHS = {
    /** Browse catalog by level (1-5) */
    CATALOG_LEVEL: '/catalog/level',
    /** Browse catalog by specific path (L1,L2,L3,L4,L5) */
    CATALOG_PATH: '/catalog/path',
    /** Get time series data by series ID(s) */
    DATA_LIST: '/data/list',
    /** Get time series data by catalog path */
    DATA_PATH: '/data/path',
} as const;

/** Price Index API endpoint paths */
export const CBS_PRICE_INDEX_PATHS = {
    /** Get all price index chapters */
    CATALOG: '/catalog/catalog',
    /** Get topics within a specific chapter */
    CHAPTER: '/catalog/chapter',
    /** Get index codes for a specific subject/topic */
    SUBJECT: '/catalog/subject',
    /** Get price index values by index code */
    PRICE: '/data/price',
    /** Calculate index adjustment between two dates - uses dynamic path segment */
    CALCULATOR: '/data/calculator',
} as const;

/** Dictionary API endpoint paths - dynamic paths based on subject/resource */
export const CBS_DICTIONARY_PATHS = {
    /**
     * Search a dictionary resource: /{subject}/{resource}
     * Example: /geo/localities
     */
    SEARCH: '/{subject}/{resource}',
    /**
     * Get specific dictionary items by ID(s): /{subject}/{resource}/{ids}
     * Example: /geo/localities/1000,2000
     */
    GET_BY_IDS: '/{subject}/{resource}/{ids}',
} as const;

/** Combined CBS endpoints configuration */
export const CBS_ENDPOINTS = {
    series: {
        baseUrl: CBS_SERIES_BASE_URL,
        paths: CBS_SERIES_PATHS,
    },
    priceIndex: {
        baseUrl: CBS_PRICE_INDEX_BASE_URL,
        paths: CBS_PRICE_INDEX_PATHS,
    },
    dictionary: {
        baseUrl: CBS_DICTIONARY_BASE_URL,
        paths: CBS_DICTIONARY_PATHS,
    },
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/** Allowed values for Series API paths */
export type CbsSeriesPath = (typeof CBS_SERIES_PATHS)[keyof typeof CBS_SERIES_PATHS];

/** Allowed values for Price Index API paths */
export type CbsPriceIndexPath = (typeof CBS_PRICE_INDEX_PATHS)[keyof typeof CBS_PRICE_INDEX_PATHS];

/** Allowed values for Dictionary API path templates */
export type CbsDictionaryPath = (typeof CBS_DICTIONARY_PATHS)[keyof typeof CBS_DICTIONARY_PATHS];

/** Parameter value types that can be serialized to URL query strings */
export type UrlParamValue = string | number | boolean | undefined | null;

/** Generic record type for URL parameters */
export type UrlParams = Record<string, UrlParamValue>;

/** Path segments for dynamic URL construction (e.g., dictionary endpoints) */
export interface DictionaryPathSegments {
    subject: string;
    resource: string;
    ids?: string;
}

/** Path segments for calculator endpoint */
export interface CalculatorPathSegments {
    id: string;
}

// ============================================================================
// URL Builder Functions
// ============================================================================

/**
 * Builds a complete CBS API URL from base URL, path, and optional parameters.
 *
 * @param baseUrl - The base URL for the CBS sub-API
 * @param path - The endpoint path (may contain path segments to encode)
 * @param params - Optional query parameters (undefined/null values are omitted)
 * @returns The fully constructed URL with encoded path and query parameters
 *
 * @example
 * // Basic usage with static path
 * buildCbsUrl(CBS_SERIES_BASE_URL, '/catalog/level', { id: 1, lang: 'he' })
 * // Returns: "https://apis.cbs.gov.il/series/catalog/level?format=json&id=1&lang=he"
 *
 * @example
 * // With undefined params filtered out
 * buildCbsUrl(CBS_SERIES_BASE_URL, '/data/list', { id: '123', startPeriod: undefined })
 * // Returns: "https://apis.cbs.gov.il/series/data/list?format=json&id=123"
 */
export function buildCbsUrl(baseUrl: string, path: string, params?: UrlParams): string {
    // Normalize: ensure baseUrl doesn't end with / and path starts with /
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Concatenate base URL and path, then create URL for query params
    const fullUrl = `${normalizedBase}${normalizedPath}`;
    const url = new URL(fullUrl);

    // Add format=json as default parameter (CBS APIs use this)
    url.searchParams.set('format', 'json');

    // Add query parameters, filtering out undefined and null values
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
 * Builds a Dictionary API URL with dynamic path segments.
 *
 * @param segments - Path segments for the dictionary endpoint
 * @param params - Optional query parameters
 * @returns The fully constructed URL
 *
 * @example
 * buildDictionaryUrl({ subject: 'geo', resource: 'localities' }, { q: 'תל אביב' })
 * // Returns: "https://api.cbs.gov.il/dictionary/geo/localities?format=json&q=%D7%AA%D7%9C%20%D7%90%D7%91%D7%99%D7%91"
 */
export function buildDictionaryUrl(segments: DictionaryPathSegments, params?: UrlParams): string {
    const { subject, resource, ids } = segments;

    // Encode path segments to handle special characters
    const encodedSubject = encodeURIComponent(subject);
    const encodedResource = encodeURIComponent(resource);

    let path: string;
    if (ids !== undefined) {
        const encodedIds = encodeURIComponent(ids);
        path = `/${encodedSubject}/${encodedResource}/${encodedIds}`;
    } else {
        path = `/${encodedSubject}/${encodedResource}`;
    }

    return buildCbsUrl(CBS_DICTIONARY_BASE_URL, path, params);
}

/**
 * Builds a Price Index Calculator URL with the index ID in the path.
 *
 * @param segments - Path segments containing the index ID
 * @param params - Optional query parameters
 * @returns The fully constructed URL
 *
 * @example
 * buildCalculatorUrl({ id: '120010' }, { startDate: '2020-01', endDate: '2023-01' })
 * // Returns: "https://api.cbs.gov.il/index/data/calculator/120010?format=json&startDate=2020-01&endDate=2023-01"
 */
export function buildCalculatorUrl(segments: CalculatorPathSegments, params?: UrlParams): string {
    const encodedId = encodeURIComponent(segments.id);
    const path = `${CBS_PRICE_INDEX_PATHS.CALCULATOR}/${encodedId}`;

    return buildCbsUrl(CBS_PRICE_INDEX_BASE_URL, path, params);
}

/**
 * Builds a Series API URL.
 *
 * @param path - The series endpoint path
 * @param params - Optional query parameters
 * @returns The fully constructed URL
 *
 * @example
 * buildSeriesUrl(CBS_SERIES_PATHS.CATALOG_LEVEL, { id: 1, lang: 'he' })
 * // Returns: "https://apis.cbs.gov.il/series/catalog/level?format=json&id=1&lang=he"
 */
export function buildSeriesUrl(path: CbsSeriesPath, params?: UrlParams): string {
    return buildCbsUrl(CBS_SERIES_BASE_URL, path, params);
}

/**
 * Builds a Price Index API URL (excluding calculator which has dynamic path).
 *
 * @param path - The price index endpoint path
 * @param params - Optional query parameters
 * @returns The fully constructed URL
 *
 * @example
 * buildPriceIndexUrl(CBS_PRICE_INDEX_PATHS.CATALOG, { lang: 'he' })
 * // Returns: "https://api.cbs.gov.il/index/catalog/catalog?format=json&lang=he"
 */
export function buildPriceIndexUrl(path: CbsPriceIndexPath, params?: UrlParams): string {
    return buildCbsUrl(CBS_PRICE_INDEX_BASE_URL, path, params);
}
