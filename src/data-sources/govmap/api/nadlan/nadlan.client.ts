/**
 * Nadlan (Real Estate) API Client
 *
 * Provides typed access to the Govmap real estate API.
 * Uses the shared GovMap client infrastructure for requests.
 */

import { govmapRequest, parseCoordinatesFromShape } from '../govmap.client';
import type { AutocompleteResponse, CoordinatePoint } from '../govmap.types';
import type { Deal, DealStatistics, DealType, DealsResponse, PolygonMetadata, RawDeal } from './nadlan.types';

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

export { cleanDeals, computeStatistics, BLOAT_FIELDS };
