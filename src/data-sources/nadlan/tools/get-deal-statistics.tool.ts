/**
 * Get Deal Statistics Tool
 *
 * Returns market statistics for an area without individual deal details.
 * Useful for quick market overview without consuming too many tokens.
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

export const getDealStatisticsInputSchema = z.object({
    address: z
        .string()
        .describe(
            'Full Israeli address in Hebrew including street name, house number, and city (e.g. "סוקולוב 38 חולון"). A city name alone will not return useful results.',
        ),
    yearsBack: z.number().int().min(1).max(10).optional().describe('How many years back (default: 2)'),
    radiusMeters: z.number().int().min(10).max(5000).optional().describe('Search radius in meters (default: 100)'),
    dealType: z
        .union([z.literal(1), z.literal(2)])
        .optional()
        .describe('1=first hand, 2=second hand (default: 2)'),
    ...commonToolInput,
});

export const getDealStatisticsOutputSchema = toolOutputSchema({
    address: z.string(),
    dealType: z.number(),
    dealTypeDescription: z.string(),
    statistics: z.object({
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
    }),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getNadlanDealStatistics = createTool({
    id: 'getNadlanDealStatistics',
    description:
        'Get aggregated market statistics (average price, price per sqm, area) for an area without returning individual deals. Provide a FULL Hebrew address (street + number + city). Internally performs autocomplete, polygon discovery, and deal fetching. Use this for quick market overview.',
    inputSchema: getDealStatisticsInputSchema,
    outputSchema: getDealStatisticsOutputSchema,
    execute: async ({ address, yearsBack = 2, radiusMeters = 100, dealType = 2 }) => {
        const dealTypeDescription = dealType === 1 ? 'יד ראשונה (חדש)' : 'יד שנייה (משומש)';
        const portalUrl = buildGovmapPortalUrl();

        try {
            const result = await nadlanApi.findRecentDealsForAddress(address, yearsBack, radiusMeters, 200, dealType);

            if (!result.deals.length) {
                return {
                    success: false as const,
                    error: `לא נמצאו עסקאות ${dealTypeDescription} ליד "${address}"`,
                    portalUrl,
                };
            }

            return {
                success: true as const,
                address,
                dealType,
                dealTypeDescription,
                statistics: result.statistics,
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
        title: name ? `סטטיסטיקת נדל"ן — ${name}` : 'סטטיסטיקת נדל"ן — govmap.gov.il',
        urlType: 'portal',
    };
};
