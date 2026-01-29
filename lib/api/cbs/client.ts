/**
 * Israel CBS (Central Bureau of Statistics) API Client
 *
 * Provides typed access to 3 CBS sub-APIs:
 * - Series: Statistical time series catalog and data
 * - Price Index: CPI and price index data
 * - Dictionary: Geographic and classification lookups
 */

import axios from 'axios';
import type {
    CbsCatalogLevelParams,
    CbsCatalogPathParams,
    CbsCatalogResponse,
    CbsDictionaryResponse,
    CbsDictionarySearchParams,
    CbsLang,
    CbsLocality,
    CbsPaginationParams,
    CbsPriceCalculatorParams,
    CbsPriceCalculatorResult,
    CbsPriceChapter,
    CbsPriceDataParams,
    CbsPriceDataResponse,
    CbsPriceIndexCode,
    CbsPriceTopic,
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

/** Axios instance for CBS Series API */
const seriesInstance = axios.create({
    ...commonConfig,
    baseURL: SERIES_BASE_URL,
    params: { format: 'json' },
});

/** Axios instance for CBS Price Index API */
const priceIndexInstance = axios.create({
    ...commonConfig,
    baseURL: PRICE_INDEX_BASE_URL,
    params: { format: 'json' },
});

/** Axios instance for CBS Dictionary API */
const dictionaryInstance = axios.create({
    ...commonConfig,
    baseURL: DICTIONARY_BASE_URL,
    params: { format: 'json' },
});

// ============================================================================
// Generic Helpers
// ============================================================================

/**
 * Generic GET request for CBS APIs (no response wrapper to unwrap)
 */
async function cbsGet<T>(
    instance: ReturnType<typeof axios.create>,
    endpoint: string,
    params?: Record<string, unknown>,
): Promise<T> {
    const response = await instance.get<T>(endpoint, { params });
    return response.data;
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
            return cbsGet<CbsCatalogResponse>(seriesInstance, '/catalog/level', {
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
            return cbsGet<CbsCatalogResponse>(seriesInstance, '/catalog/path', {
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
            return cbsGet<CbsSeriesDataResponse>(seriesInstance, '/data/list', {
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
    },

    /**
     * Price Index API - CPI and price index data
     */
    priceIndex: {
        /**
         * Get all price index chapters
         */
        catalog: async (params?: { lang?: CbsLang; page?: number; pagesize?: number }) => {
            return cbsGet<CbsPriceChapter[]>(priceIndexInstance, '/catalog/catalog', {
                lang: params?.lang,
                page: params?.page,
                pagesize: params?.pagesize,
            });
        },

        /**
         * Get topics within a specific chapter
         */
        chapter: async (id: string, params?: { lang?: CbsLang; page?: number; pagesize?: number }) => {
            return cbsGet<CbsPriceTopic[]>(priceIndexInstance, '/catalog/chapter', {
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
            return cbsGet<CbsPriceIndexCode[]>(priceIndexInstance, '/catalog/subject', {
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
        search: async <T = CbsLocality>(subject: string, resource: string, params?: CbsDictionarySearchParams) => {
            return cbsGet<CbsDictionaryResponse<T>>(
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
        get: async <T = CbsLocality>(
            subject: string,
            resource: string,
            ids: string,
            params?: CbsDictionarySearchParams,
        ) => {
            return cbsGet<CbsDictionaryResponse<T>>(
                dictionaryInstance,
                `/${subject}/${resource}/${ids}`,
                params as Record<string, unknown>,
            );
        },
    },
};
