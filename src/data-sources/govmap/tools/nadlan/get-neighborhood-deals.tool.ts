/**
 * Get Neighborhood Deals Tool
 *
 * Retrieves real estate deals for a specific neighborhood polygon ID.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { nadlanApi } from '../../api/nadlan/nadlan.client';
import { buildNeighborhoodDealsUrl } from '../../api/nadlan/nadlan.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getNeighborhoodDealsInputSchema = z.object({
    polygonId: z
        .string()
        .describe(
            'Neighborhood polygon ID obtained from the deals-by-radius endpoint (via findRecentNadlanDeals). The autocomplete endpoint does NOT return polygon IDs.',
        ),
    limit: z.number().int().min(1).max(500).optional().describe('Max deals to return (default: 30)'),
    dealType: z
        .union([z.literal(1), z.literal(2)])
        .optional()
        .describe('1=first hand, 2=second hand (default: 2)'),
    ...commonToolInput,
});

export const getNeighborhoodDealsOutputSchema = toolOutputSchema({
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

export const getNeighborhoodNadlanDeals = createTool({
    id: 'getNeighborhoodNadlanDeals',
    description:
        'Get real estate deals for a specific neighborhood polygon. Requires a polygon_id from the deals-by-radius endpoint (returned internally by findRecentNadlanDeals). dealType: 1=new/first-hand, 2=used/second-hand (default 2).',
    inputSchema: getNeighborhoodDealsInputSchema,
    outputSchema: getNeighborhoodDealsOutputSchema,
    execute: async ({ polygonId, limit = 30, dealType = 2 }) => {
        const dealTypeDescription = dealType === 1 ? 'יד ראשונה (חדש)' : 'יד שנייה (משומש)';
        const apiUrl = buildNeighborhoodDealsUrl(polygonId, { limit, dealType });

        try {
            const result = await nadlanApi.getNeighborhoodDeals(polygonId, limit, dealType);

            if (!result.deals.length) {
                return {
                    success: false as const,
                    error: `לא נמצאו עסקאות ${dealTypeDescription} בשכונה ${polygonId}`,
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
