/**
 * Get Street Deals Tool
 *
 * Retrieves real estate deals for a specific street polygon ID.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { nadlanApi } from '../api/nadlan.client';
import { buildStreetDealsUrl } from '../api/nadlan.endpoints';
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

export const getStreetDealsInputSchema = z.object({
    polygonId: z.string().describe('Polygon ID of the street/area (from deals-by-radius or autocomplete)'),
    limit: z.number().int().min(1).max(500).optional().describe('Max deals to return (default: 100)'),
    dealType: z
        .union([z.literal(1), z.literal(2)])
        .optional()
        .describe('1=first hand, 2=second hand (default: 2)'),
    ...commonToolInput,
});

export const getStreetDealsOutputSchema = toolOutputSchema({
    totalDeals: z.number(),
    polygonId: z.string(),
    dealType: z.number(),
    dealTypeDescription: z.string(),
    statistics: z.object({
        totalDeals: z.number(),
        pricePerSqmStats: z
            .object({
                mean: z.number(),
                min: z.number(),
                max: z.number(),
                median: z.number(),
            })
            .optional(),
    }),
    deals: z.array(
        z.object({
            id: z.number(),
            dealAmount: z.number(),
            dealDate: z.string(),
            assetArea: z.number().optional(),
            pricePerSqm: z.number().optional(),
            settlementName: z.string().optional(),
            streetName: z.string().optional(),
            houseNumber: z.string().optional(),
            assetType: z.string().optional(),
            neighborhood: z.string().optional(),
            floor: z.string().optional(),
            floorNumber: z.number().optional(),
            rooms: z.number().optional(),
        }),
    ),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getStreetNadlanDeals = createTool({
    id: 'getStreetNadlanDeals',
    description:
        'Get real estate deals for a specific street polygon. Use a polygon ID obtained from findRecentNadlanDeals or autocomplete results.',
    inputSchema: getStreetDealsInputSchema,
    outputSchema: getStreetDealsOutputSchema,
    execute: async ({ polygonId, limit = 100, dealType = 2 }) => {
        const dealTypeDescription = dealType === 1 ? 'יד ראשונה (חדש)' : 'יד שנייה (משומש)';
        const apiUrl = buildStreetDealsUrl(polygonId, { limit, dealType });

        try {
            const result = await nadlanApi.getStreetDeals(polygonId, limit, dealType);

            if (!result.deals.length) {
                return {
                    success: false as const,
                    error: `לא נמצאו עסקאות ${dealTypeDescription} עבור פוליגון ${polygonId}`,
                    apiUrl,
                };
            }

            return {
                success: true as const,
                totalDeals: result.deals.length,
                polygonId,
                dealType,
                dealTypeDescription,
                statistics: result.statistics,
                deals: result.deals,
                apiUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
            };
        }
    },
});

// ============================================================================
// Source URL Resolver
// ============================================================================

export const resolveSourceUrl: ToolSourceResolver = (input, output) => {
    const apiUrl = getString(output, 'apiUrl');
    if (!apiUrl) return null;
    const name = getString(input, 'searchedResourceName');
    return {
        url: apiUrl,
        title: name ? `עסקאות רחוב — ${name}` : 'עסקאות רחוב — govmap.gov.il',
        urlType: 'api',
    };
};
