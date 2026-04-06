/**
 * Get Valuation Comparables Tool
 *
 * Finds comparable property transactions near an address for valuation purposes.
 * Focuses on similar properties (by area range) and calculates estimated value.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { nadlanApi } from '../../api/nadlan/nadlan.client';
import { buildGovmapPortalUrl } from '../../api/nadlan/nadlan.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getValuationComparablesInputSchema = z.object({
    address: z
        .string()
        .describe(
            'Full Israeli address in Hebrew including street name, house number, and city (e.g. "סוקולוב 38 חולון"). A city name alone will not return useful results.',
        ),
    targetAreaSqm: z
        .number()
        .min(10)
        .max(1000)
        .optional()
        .describe('Target property area in sqm for filtering (optional)'),
    radiusMeters: z.number().int().min(10).max(5000).optional().describe('Search radius in meters (default: 200)'),
    yearsBack: z.number().int().min(1).max(5).optional().describe('How many years back (default: 2)'),
    dealType: z
        .union([z.literal(1), z.literal(2)])
        .optional()
        .describe('1=first hand, 2=second hand (default: 2)'),
    ...commonToolInput,
});

export const getValuationComparablesOutputSchema = toolOutputSchema({
    address: z.string(),
    targetAreaSqm: z.number().optional(),
    comparableCount: z.number(),
    estimatedValuePerSqm: z.number().optional().describe('Estimated value per sqm in NIS based on comparables'),
    estimatedTotalValue: z.number().optional().describe('Estimated total value in NIS (if targetAreaSqm provided)'),
    comparables: z.array(
        z.object({
            id: z.number(),
            dealAmount: z.number().describe('Price in NIS'),
            dealDate: z.string(),
            assetArea: z.number().nullable().optional().describe('Area in sqm'),
            pricePerSqm: z.number().nullable().optional().describe('Price per sqm in NIS'),
            settlementName: z.string().nullable().optional(),
            streetName: z.string().nullable().optional(),
            houseNumber: z.string().nullable().optional(),
            assetType: z.string().nullable().optional(),
            rooms: z.number().nullable().optional(),
        }),
    ),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getNadlanValuationComparables = createTool({
    id: 'getNadlanValuationComparables',
    description:
        'Find comparable property transactions for valuation purposes. Provide a FULL Hebrew address (street + number + city). Internally performs autocomplete, polygon discovery, and deal fetching. Returns similar properties near the address with estimated value per sqm. Optionally filter by target area to get more relevant comparables.',
    inputSchema: getValuationComparablesInputSchema,
    outputSchema: getValuationComparablesOutputSchema,
    execute: async ({ address, targetAreaSqm, radiusMeters = 200, yearsBack = 2, dealType = 2 }) => {
        const portalUrl = buildGovmapPortalUrl(undefined, undefined, address);

        try {
            const result = await nadlanApi.findRecentDealsForAddress(address, yearsBack, radiusMeters, 200, dealType);

            if (!result.deals.length) {
                return {
                    success: false as const,
                    error: `לא נמצאו עסקאות השוואה ליד "${address}"`,
                    portalUrl,
                };
            }

            // Filter to deals with valid area and price
            let comparables = result.deals.filter(
                (d) => d.assetArea && d.assetArea > 0 && d.pricePerSqm && d.pricePerSqm > 0,
            );

            // If target area specified, filter to +/- 30% range
            if (targetAreaSqm) {
                const minArea = targetAreaSqm * 0.7;
                const maxArea = targetAreaSqm * 1.3;
                const filtered = comparables.filter(
                    (d) => d.assetArea !== undefined && d.assetArea >= minArea && d.assetArea <= maxArea,
                );
                // Use filtered if we have enough, otherwise keep all
                if (filtered.length >= 3) {
                    comparables = filtered;
                }
            }

            // Sort by date (most recent first) and limit to 20
            comparables.sort((a, b) => b.dealDate.localeCompare(a.dealDate));
            comparables = comparables.slice(0, 20);

            // Renumber
            comparables = comparables.map((d, idx) => ({ ...d, id: idx + 1 }));

            // Calculate estimated value
            const ppsqmValues = comparables
                .map((d) => d.pricePerSqm)
                .filter((p): p is number => p !== undefined && p > 0);

            const estimatedValuePerSqm =
                ppsqmValues.length > 0
                    ? Math.round(ppsqmValues.reduce((a, b) => a + b, 0) / ppsqmValues.length)
                    : undefined;

            const estimatedTotalValue =
                estimatedValuePerSqm && targetAreaSqm ? Math.round(estimatedValuePerSqm * targetAreaSqm) : undefined;

            return {
                success: true as const,
                address,
                targetAreaSqm,
                comparableCount: comparables.length,
                estimatedValuePerSqm,
                estimatedTotalValue,
                comparables,
                portalUrl: result.searchCoordinates
                    ? buildGovmapPortalUrl(
                          result.searchCoordinates.longitude,
                          result.searchCoordinates.latitude,
                          address,
                      )
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
