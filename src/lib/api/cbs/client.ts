/**
 * Israel CBS (Central Bureau of Statistics) API Client
 *
 * Provides typed access to 3 CBS sub-APIs:
 * - Series: Statistical time series catalog and data
 * - Price Index: CPI and price index data
 * - Dictionary: Geographic and classification lookups
 *
 * Includes:
 * - Retry with exponential backoff for transient 5xx errors
 * - Concurrency limiter (p-limit) to avoid overwhelming CBS servers
 * - XML fallback detection (CBS sometimes returns XML even when JSON is requested)
 */

import axios, { type AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { parseStringPromise } from 'xml2js';
import { sleep } from '@/lib/utils/sleep';
import type {
    CbsCatalogLevelParams,
    CbsCatalogPathParams,
    CbsCatalogResponse,
    CbsDictionaryResponse,
    CbsDictionarySearchParams,
    CbsLang,
    CbsPriceCalculatorParams,
    CbsPriceCalculatorResult,
    CbsPriceChapterResponse,
    CbsPriceChaptersResponse,
    CbsPriceDataParams,
    CbsPriceDataResponse,
    CbsPriceSubjectResponse,
    CbsSeriesDataParams,
    CbsSeriesDataResponse,
} from './types';

// ============================================================================
// Axios Instances
// ============================================================================

const SERIES_BASE_URL = 'https://apis.cbs.gov.il/series';
const PRICE_INDEX_BASE_URL = 'https://api.cbs.gov.il/index';
const DICTIONARY_BASE_URL = 'https://api.cbs.gov.il/dictionary';

const commonConfig = {
    timeout: 15000,
    headers: {
        Accept: 'application/json',
    },
};

/** Axios instance for CBS Series Catalog API (returns JSON by default, breaks with format=json) */
const seriesCatalogInstance = axios.create({
    ...commonConfig,
    baseURL: SERIES_BASE_URL,
});

/** Axios instance for CBS Series Data API (requires format=json) */
const seriesDataInstance = axios.create({
    ...commonConfig,
    baseURL: SERIES_BASE_URL,
    params: { format: 'json', download: 'false' },
});

/** Axios instance for CBS Price Index API */
const priceIndexInstance = axios.create({
    ...commonConfig,
    baseURL: PRICE_INDEX_BASE_URL,
    params: { format: 'json', download: 'false' },
});

/** Axios instance for CBS Dictionary API */
const dictionaryInstance = axios.create({
    ...commonConfig,
    baseURL: DICTIONARY_BASE_URL,
    params: { format: 'json', download: 'false' },
});

// ============================================================================
// Concurrency Limiter
// ============================================================================

/** Max 5 concurrent CBS API requests (matches israel-statistics-mcp pattern) */
const cbsLimit = pLimit(5);

// ============================================================================
// Generic Helpers
// ============================================================================

/** Status codes worth retrying (transient server errors) */
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);

/** Max retry attempts for transient CBS API errors */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff */
const BASE_DELAY_MS = 1000;

/** Detect if a string response is XML (CBS sometimes returns XML instead of JSON) */
function isXmlContent(text: string): boolean {
    const trimmed = text.trimStart();
    return trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && !trimmed.startsWith('<html'));
}

/**
 * Parse an XML string using xml2js with the same config as israel-statistics-mcp.
 * Returns the parsed object or throws if parsing fails.
 */
async function parseXml<T>(xml: string): Promise<T> {
    return parseStringPromise(xml, {
        explicitArray: true,
        ignoreAttrs: false,
        mergeAttrs: true,
    }) as Promise<T>;
}

/**
 * Generic GET request for CBS APIs with:
 * - Concurrency limiting (max 5 concurrent requests via p-limit)
 * - Retry with exponential backoff for 5xx errors and timeouts
 * - XML fallback detection and parsing
 * - HTML error page detection
 */
function cbsGet<T>(
    instance: AxiosInstance,
    endpoint: string,
    params?: Record<string, unknown>,
): Promise<T> {
    return cbsLimit(() => cbsGetWithRetry<T>(instance, endpoint, params));
}

async function cbsGetWithRetry<T>(
    instance: AxiosInstance,
    endpoint: string,
    params?: Record<string, unknown>,
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await instance.get<T>(endpoint, { params });
            const data = response.data;

            if (typeof data === 'string') {
                if (data.includes('<html')) {
                    throw new Error(
                        'CBS API returned an error page instead of data. The requested path may be invalid.',
                    );
                }
                if (isXmlContent(data)) {
                    return await parseXml<T>(data);
                }
            }

            return data;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            const isRetryable = status !== undefined && RETRYABLE_STATUS_CODES.has(status);
            const isTimeout = axios.isAxiosError(error) && error.code === 'ECONNABORTED';

            if ((isRetryable || isTimeout) && attempt < MAX_RETRIES) {
                await sleep(BASE_DELAY_MS * Math.pow(2, attempt)); // 1s, 2s, 4s
                continue;
            }

            throw lastError;
        }
    }

    // Unreachable, but satisfies TypeScript
    throw lastError ?? new Error('CBS API request failed after retries');
}

// ============================================================================
// CBS API Client
// ============================================================================

/**
 * CBS API client with organized namespaces
 */
export const cbsApi = {
    /**
     * Series API - Statistical time series catalog and data
     */
    series: {
        /**
         * Browse catalog by level (1-5)
         * Level 1 = top categories, each subsequent level drills deeper
         */
        catalog: async (params: CbsCatalogLevelParams) => {
            return cbsGet<CbsCatalogResponse>(seriesCatalogInstance, '/catalog/level', {
                id: params.id,
                subject: params.subject,
                lang: params.lang,
                page: params.page,
                pagesize: params.pagesize,
            });
        },

        /**
         * Browse catalog by specific path (L1,L2,L3,L4,L5)
         */
        catalogByPath: async (params: CbsCatalogPathParams) => {
            return cbsGet<CbsCatalogResponse>(seriesCatalogInstance, '/catalog/path', {
                id: params.id,
                lang: params.lang,
                page: params.page,
                pagesize: params.pagesize,
            });
        },

        /**
         * Get time series data by series ID(s)
         */
        data: async (params: CbsSeriesDataParams) => {
            return cbsGet<CbsSeriesDataResponse>(seriesDataInstance, '/data/list', {
                id: params.id,
                startPeriod: params.startPeriod,
                endPeriod: params.endPeriod,
                last: params.last,
                addNull: params.addNull,
                data_hide: params.data_hide,
                lang: params.lang,
                page: params.page,
                pagesize: params.pagesize,
            });
        },

        /**
         * Get time series data by catalog path (e.g., "2,1,1,2,379")
         */
        dataByPath: async (params: CbsSeriesDataParams) => {
            return cbsGet<CbsSeriesDataResponse>(seriesDataInstance, '/data/path', {
                id: params.id,
                startPeriod: params.startPeriod,
                endPeriod: params.endPeriod,
                last: params.last,
                lang: params.lang,
                page: params.page,
                pagesize: params.pagesize,
            });
        },
    },

    /**
     * Price Index API - CPI and price index data
     */
    priceIndex: {
        /**
         * Get all price index chapters
         */
        catalog: async (params?: { lang?: CbsLang; page?: number; pagesize?: number }) => {
            return cbsGet<CbsPriceChaptersResponse>(priceIndexInstance, '/catalog/catalog', {
                lang: params?.lang,
                page: params?.page,
                pagesize: params?.pagesize,
            });
        },

        /**
         * Get topics within a specific chapter
         */
        chapter: async (id: string, params?: { lang?: CbsLang; page?: number; pagesize?: number }) => {
            return cbsGet<CbsPriceChapterResponse>(priceIndexInstance, '/catalog/chapter', {
                id,
                lang: params?.lang,
                page: params?.page,
                pagesize: params?.pagesize,
            });
        },

        /**
         * Get index codes for a specific subject/topic
         */
        subject: async (id: string, params?: { lang?: CbsLang; page?: number; pagesize?: number }) => {
            return cbsGet<CbsPriceSubjectResponse>(priceIndexInstance, '/catalog/subject', {
                id,
                lang: params?.lang,
                page: params?.page,
                pagesize: params?.pagesize,
            });
        },

        /**
         * Get price index values by index code
         */
        price: async (params: CbsPriceDataParams) => {
            return cbsGet<CbsPriceDataResponse>(priceIndexInstance, '/data/price', {
                id: params.id,
                startPeriod: params.startPeriod,
                endPeriod: params.endPeriod,
                last: params.last,
                coef: params.coef,
                lang: params.lang,
            });
        },

        /**
         * Calculate index adjustment between two dates
         */
        calculator: async (params: CbsPriceCalculatorParams) => {
            return cbsGet<CbsPriceCalculatorResult>(
                priceIndexInstance,
                `/data/calculator/${encodeURIComponent(params.id)}`,
                {
                    startDate: params.startDate,
                    endDate: params.endDate,
                    sum: params.sum,
                    lang: params.lang,
                },
            );
        },
    },

    /**
     * Dictionary API - Geographic and classification lookups
     */
    dictionary: {
        /**
         * Search a dictionary resource
         * @param subject - Dictionary subject (e.g., "geo")
         * @param resource - Resource name (e.g., "localities", "districts")
         * @param params - Search parameters
         */
        search: async (subject: string, resource: string, params?: CbsDictionarySearchParams) => {
            return cbsGet<CbsDictionaryResponse>(
                dictionaryInstance,
                `/${subject}/${resource}`,
                params as Record<string, unknown>,
            );
        },

        /**
         * Get specific dictionary items by ID(s)
         * @param subject - Dictionary subject (e.g., "geo")
         * @param resource - Resource name (e.g., "localities")
         * @param ids - Comma-separated IDs
         * @param params - Additional parameters
         */
        get: async (
            subject: string,
            resource: string,
            ids: string,
            params?: CbsDictionarySearchParams,
        ) => {
            return cbsGet<CbsDictionaryResponse>(
                dictionaryInstance,
                `/${subject}/${resource}/${ids}`,
                params as Record<string, unknown>,
            );
        },
    },
};
