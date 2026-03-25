/**
 * Govmap Nadlan API Client
 *
 * Provides typed access to the Govmap real estate API.
 * Includes retry with exponential backoff and simple rate limiting (5 req/s).
 */

import axios, { type AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { sleep } from '@/lib/utils/sleep';
import { GOVMAP_BASE_URL } from './nadlan.endpoints';
import type {
    AutocompleteResponse,
    CoordinatePoint,
    Deal,
    DealStatistics,
    DealType,
    DealsResponse,
    PolygonMetadata,
    RawDeal,
} from './nadlan.types';

// ============================================================================
// Axios Instance
// ============================================================================

const govmapInstance: AxiosInstance = axios.create({
    baseURL: GOVMAP_BASE_URL,
    timeout: 30_000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// ============================================================================
// Rate Limiting & Concurrency
// ============================================================================

/** Max 5 concurrent requests to respect Govmap rate limit */
const govmapLimit = pLimit(5);

/** Min interval between requests (200ms = 5 req/s) */
const MIN_INTERVAL_MS = 200;
let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
    const elapsed = Date.now() - lastRequestTime;
    if (elapsed < MIN_INTERVAL_MS) {
        await sleep(MIN_INTERVAL_MS - elapsed);
    }
    lastRequestTime = Date.now();
}

// ============================================================================
// Retry Logic
// ============================================================================

/** Status codes worth retrying (transient server errors) */
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function govmapRequest<T>(
    method: 'get' | 'post',
    endpoint: string,
    options?: { params?: Record<string, unknown>; data?: Record<string, unknown> },
): Promise<T> {
    return govmapLimit(async () => {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                await rateLimit();

                const response =
                    method === 'get'
                        ? await govmapInstance.get<T>(endpoint, { params: options?.params })
                        : await govmapInstance.post<T>(endpoint, options?.data);

                return response.data;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                const status = axios.isAxiosError(error) ? error.response?.status : undefined;
                const isRetryable = status !== undefined && RETRYABLE_STATUS_CODES.has(status);
                const isTimeout = axios.isAxiosError(error) && error.code === 'ECONNABORTED';

                if ((isRetryable || isTimeout) && attempt < MAX_RETRIES) {
                    await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
                    continue;
                }

                throw lastError;
            }
        }

        throw lastError ?? new Error('Govmap API request failed after retries');
    });
}

// ============================================================================
// Deal Processing Helpers
// ============================================================================

/** Fields to strip from raw deals (large/internal) */
const BLOAT_FIELDS = new Set([
    'shape',
    'sourceorder',
    'objectid',
    'priority',
    'source_polygon_id',
    'sourcePolygonId',
    'settlementId',
    'streetCode',
    'dealId',
    'polygonId',
    'deal_type_description',
]);

/** Convert raw deals to clean Deal objects */
function cleanDeals(rawDeals: RawDeal[]): Deal[] {
    return rawDeals.map((raw, idx) => {
        const area = raw.assetArea;
        const pricePerSqm = area && area > 0 ? Math.round(raw.dealAmount / area) : undefined;

        return {
            id: idx + 1,
            dealAmount: raw.dealAmount,
            dealDate: raw.dealDate,
            assetArea: area,
            pricePerSqm,
            settlementName: raw.settlementNameHeb ?? raw.settlementNameEng,
            streetName: raw.streetNameHeb ?? raw.streetName ?? raw.streetNameEng,
            houseNumber: raw.houseNumber,
            assetType: raw.assetTypeHeb ?? raw.propertyTypeDescription ?? raw.assetTypeEng,
            neighborhood: raw.neighborhood,
            floor: raw.floor,
            floorNumber: raw.floorNumber,
            rooms: raw.assetRoomNum,
        };
    });
}

/** Compute aggregate statistics from clean deals */
function computeStatistics(deals: Deal[]): DealStatistics {
    const prices = deals.map((d) => d.dealAmount).filter((p): p is number => p > 0);
    const areas = deals.map((d) => d.assetArea).filter((a): a is number => a !== undefined && a > 0);
    const ppsqm = deals.map((d) => d.pricePerSqm).filter((p): p is number => p !== undefined && p > 0);

    const median = (arr: number[]): number => {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    };

    const stats: DealStatistics = { totalDeals: deals.length };

    if (prices.length > 0) {
        stats.priceStats = {
            mean: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
            min: Math.min(...prices),
            max: Math.max(...prices),
            median: median(prices),
        };
    }

    if (areas.length > 0) {
        stats.areaStats = {
            mean: Math.round(areas.reduce((a, b) => a + b, 0) / areas.length),
            min: Math.min(...areas),
            max: Math.max(...areas),
        };
    }

    if (ppsqm.length > 0) {
        stats.pricePerSqmStats = {
            mean: Math.round(ppsqm.reduce((a, b) => a + b, 0) / ppsqm.length),
            min: Math.round(Math.min(...ppsqm)),
            max: Math.round(Math.max(...ppsqm)),
            median: median(ppsqm),
        };
    }

    return stats;
}

// ============================================================================
// Parse Coordinates from WKT POINT
// ============================================================================

function parseCoordinatesFromShape(shape?: string): CoordinatePoint | undefined {
    if (!shape || !shape.startsWith('POINT(')) return undefined;
    try {
        const coordsStr = shape.slice(6, -1); // Remove "POINT(" and ")"
        const parts = coordsStr.split(/\s+/);
        if (parts.length === 2) {
            return { longitude: parseFloat(parts[0]), latitude: parseFloat(parts[1]) };
        }
    } catch {
        // Ignore parse errors
    }
    return undefined;
}

// ============================================================================
// Nadlan API Client
// ============================================================================

export const nadlanApi = {
    /**
     * Autocomplete an Israeli address.
     * Returns matching addresses with coordinates.
     */
    autocompleteAddress: async (
        searchText: string,
    ): Promise<{
        results: Array<{
            text: string;
            id: string;
            type: string;
            score: number;
            coordinates?: CoordinatePoint;
        }>;
    }> => {
        const response = await govmapRequest<AutocompleteResponse>('post', '/search-service/autocomplete', {
            data: {
                searchText,
                language: 'he',
                isAccurate: false,
                maxResults: 10,
            },
        });

        return {
            results: (response.results ?? []).map((r) => ({
                text: r.text,
                id: r.id,
                type: r.type,
                score: r.score,
                coordinates: parseCoordinatesFromShape(r.shape),
            })),
        };
    },

    /**
     * Get polygon metadata within a radius of given coordinates.
     * Returns polygon IDs that can be used to fetch actual deals.
     */
    getDealsByRadius: async (longitude: number, latitude: number, radiusMeters: number): Promise<PolygonMetadata[]> => {
        const data = await govmapRequest<PolygonMetadata[]>(
            'get',
            `/real-estate/deals/${longitude},${latitude}/${radiusMeters}`,
        );

        if (!Array.isArray(data)) {
            throw new Error(`Expected array response, got ${typeof data}`);
        }

        return data;
    },

    /**
     * Get real estate deals for a specific street polygon.
     */
    getStreetDeals: async (
        polygonId: string,
        limit: number = 100,
        dealType: DealType = 2,
    ): Promise<{ deals: Deal[]; statistics: DealStatistics }> => {
        const response = await govmapRequest<DealsResponse | RawDeal[]>(
            'get',
            `/real-estate/street-deals/${encodeURIComponent(polygonId)}`,
            { params: { limit, dealType } },
        );

        const rawDeals = Array.isArray(response) ? response : (response.data ?? []);
        const deals = cleanDeals(rawDeals);

        return {
            deals,
            statistics: computeStatistics(deals),
        };
    },

    /**
     * Get real estate deals for a specific neighborhood polygon.
     */
    getNeighborhoodDeals: async (
        polygonId: string,
        limit: number = 100,
        dealType: DealType = 2,
    ): Promise<{ deals: Deal[]; statistics: DealStatistics }> => {
        const response = await govmapRequest<DealsResponse | RawDeal[]>(
            'get',
            `/real-estate/neighborhood-deals/${encodeURIComponent(polygonId)}`,
            { params: { limit, dealType } },
        );

        const rawDeals = Array.isArray(response) ? response : (response.data ?? []);
        const deals = cleanDeals(rawDeals);

        return {
            deals,
            statistics: computeStatistics(deals),
        };
    },

    /**
     * Find recent deals near an address.
     * Orchestrates autocomplete -> deals by radius -> street/neighborhood deals.
     */
    findRecentDealsForAddress: async (
        address: string,
        _yearsBack: number = 2,
        radiusMeters: number = 50,
        maxDeals: number = 100,
        dealType: DealType = 2,
    ): Promise<{
        deals: Deal[];
        statistics: DealStatistics;
        searchCoordinates?: CoordinatePoint;
    }> => {
        // Step 1: Geocode the address
        const autocomplete = await nadlanApi.autocompleteAddress(address);
        if (!autocomplete.results.length) {
            return { deals: [], statistics: { totalDeals: 0 } };
        }

        const searchCoordinates = autocomplete.results[0].coordinates;
        if (!searchCoordinates) {
            return { deals: [], statistics: { totalDeals: 0 } };
        }

        // Step 2: Find polygons near the address
        const polygons = await nadlanApi.getDealsByRadius(
            searchCoordinates.longitude,
            searchCoordinates.latitude,
            radiusMeters,
        );

        if (!polygons.length) {
            return { deals: [], statistics: { totalDeals: 0 }, searchCoordinates };
        }

        // Step 3: Fetch deals from top polygons (max 10)
        const allDeals: Deal[] = [];
        const maxPolygons = Math.min(polygons.length, 10);

        for (let i = 0; i < maxPolygons && allDeals.length < maxDeals; i++) {
            const polygon = polygons[i];
            if (!polygon.polygon_id) continue;

            try {
                const remaining = maxDeals - allDeals.length;
                const result = await nadlanApi.getStreetDeals(polygon.polygon_id, Math.min(remaining, 100), dealType);

                // Tag deals with source
                const taggedDeals = result.deals.map((d) => ({
                    ...d,
                    dealSource: i === 0 ? 'same_building' : 'street',
                }));
                allDeals.push(...taggedDeals);
            } catch {
                // Skip failed polygon queries
            }
        }

        // Re-number sequential IDs
        const numberedDeals = allDeals.slice(0, maxDeals).map((d, idx) => ({ ...d, id: idx + 1 }));

        return {
            deals: numberedDeals,
            statistics: computeStatistics(numberedDeals),
            searchCoordinates,
        };
    },
};

export { cleanDeals, computeStatistics, parseCoordinatesFromShape, BLOAT_FIELDS };
