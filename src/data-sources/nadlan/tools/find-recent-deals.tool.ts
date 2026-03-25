/**
 * Find Recent Deals Tool
 *
 * Main tool: finds recent real estate deals near a given address.
 * Orchestrates address geocoding, polygon search, and deal retrieval.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { nadlanApi } from '../api/nadlan.client';
import { buildGovmapPortalUrl } from '../api/nadlan.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Helpers
// ============================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
}

// ============================================================================
// Schemas
// ============================================================================

const dealSchema = z.object({
    id: z.number(),
    dealAmount: z.number().describe('Transaction amount in NIS'),
    dealDate: z.string().describe('Transaction date'),
    assetArea: z.number().optional().describe('Property area in sqm'),
    pricePerSqm: z.number().optional().describe('Price per sqm in NIS'),
    settlementName: z.string().optional().describe('City/settlement name'),
    streetName: z.string().optional().describe('Street name'),
    houseNumber: z.string().optional().describe('House number'),
    assetType: z.string().optional().describe('Property type'),
    neighborhood: z.string().optional().describe('Neighborhood'),
    floor: z.string().optional().describe('Floor description'),
    floorNumber: z.number().optional().describe('Numeric floor'),
    rooms: z.number().optional().describe('Number of rooms'),
    dealSource: z.string().optional().describe('Deal source: same_building, street, neighborhood'),
});

const statisticsSchema = z.object({
    totalDeals: z.number(),
    priceStats: z
        .object({
            mean: z.number(),
            min: z.number(),
            max: z.number(),
            median: z.number(),
        })
        .optional(),
    areaStats: z
        .object({
            mean: z.number(),
            min: z.number(),
            max: z.number(),
        })
        .optional(),
    pricePerSqmStats: z
        .object({
            mean: z.number(),
            min: z.number(),
            max: z.number(),
            median: z.number(),
        })
        .optional(),
});

export const findRecentDealsInputSchema = z.object({
    address: z.string().describe('Israeli address to search for deals (Hebrew or English)'),
    yearsBack: z.number().int().min(1).max(10).optional().describe('How many years back to search (default: 2)'),
    radiusMeters: z.number().int().min(10).max(5000).optional().describe('Search radius in meters (default: 50)'),
    maxDeals: z.number().int().min(1).max(200).optional().describe('Maximum deals to return (default: 100)'),
    dealType: z
        .union([z.literal(1), z.literal(2)])
        .optional()
        .describe('1=first hand (new), 2=second hand (default: 2)'),
    ...commonToolInput,
});

export const findRecentDealsOutputSchema = toolOutputSchema({
    searchParameters: z.object({
        address: z.string(),
        yearsBack: z.number(),
        radiusMeters: z.number(),
        maxDeals: z.number(),
        dealType: z.number(),
        dealTypeDescription: z.string(),
    }),
    searchCoordinates: z
        .object({
            longitude: z.number(),
            latitude: z.number(),
        })
        .optional(),
    statistics: statisticsSchema,
    deals: z.array(dealSchema),
});

export type FindRecentDealsInput = z.infer<typeof findRecentDealsInputSchema>;
export type FindRecentDealsOutput = z.infer<typeof findRecentDealsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const findRecentNadlanDeals = createTool({
    id: 'findRecentNadlanDeals',
    description:
        'Find recent real estate deals near an Israeli address. Returns deal details including price (NIS), area (sqm), price per sqm, property type, and market statistics. This is the main tool for property transaction research.',
    inputSchema: findRecentDealsInputSchema,
    outputSchema: findRecentDealsOutputSchema,
    execute: async ({ address, yearsBack = 2, radiusMeters = 50, maxDeals = 100, dealType = 2 }) => {
        const dealTypeDescription = dealType === 1 ? 'יד ראשונה (חדש)' : 'יד שנייה (משומש)';
        const portalUrl = buildGovmapPortalUrl();

        try {
            const result = await nadlanApi.findRecentDealsForAddress(
                address,
                yearsBack,
                radiusMeters,
                maxDeals,
                dealType,
            );

            if (!result.deals.length) {
                return {
                    success: false as const,
                    error: `לא נמצאו עסקאות ${dealTypeDescription} ליד הכתובת "${address}"`,
                    portalUrl,
                };
            }

            return {
                success: true as const,
                searchParameters: {
                    address,
                    yearsBack,
                    radiusMeters,
                    maxDeals,
                    dealType,
                    dealTypeDescription,
                },
                searchCoordinates: result.searchCoordinates
                    ? { longitude: result.searchCoordinates.longitude, latitude: result.searchCoordinates.latitude }
                    : undefined,
                statistics: result.statistics,
                deals: result.deals,
                portalUrl: result.searchCoordinates
                    ? buildGovmapPortalUrl(result.searchCoordinates.longitude, result.searchCoordinates.latitude)
                    : portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                portalUrl,
            };
        }
    },
});

// ============================================================================
// Source URL Resolver
// ============================================================================

export const resolveSourceUrl: ToolSourceResolver = (_input, output) => {
    const portalUrl = getString(output, 'portalUrl');
    if (!portalUrl) return null;
    const name = getString(_input, 'searchedResourceName');
    return {
        url: portalUrl,
        title: name ? `עסקאות נדל"ן — ${name}` : 'עסקאות נדל"ן — govmap.gov.il',
        urlType: 'portal',
    };
};
