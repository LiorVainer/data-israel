/**
 * Get CBS Price Data Tool
 *
 * AI SDK tool for retrieving CBS price index values
 */

import { tool } from 'ai';
import { z } from 'zod';
import { cbsApi } from '@/lib/api/cbs/client';
import { buildPriceIndexUrl, CBS_PRICE_INDEX_PATHS } from '@/lib/api/cbs/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getCbsPriceDataInputSchema = z.object({
    indexCode: z.string().describe('Price index code (get from browseCbsPriceIndices with mode "indices")'),
    startPeriod: z.string().optional().describe('Start date in mm-yyyy format (e.g., "01-2020")'),
    endPeriod: z.string().optional().describe('End date in mm-yyyy format (e.g., "12-2024")'),
    last: z.number().int().min(1).max(500).optional().describe('Return only the N most recent values'),
    includeCoefficients: z.boolean().optional().describe('Include adjustment coefficients in response'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
    searchedResourceName: z
        .string()
        .describe('Hebrew name of the price index (from catalog browsing). Shown in UI as badge label.'),
});

export const getCbsPriceDataOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        indices: z.array(
            z.object({
                code: z.number(),
                name: z.string(),
                data: z.array(
                    z.object({
                        year: z.number(),
                        month: z.number(),
                        monthDesc: z.string(),
                        value: z.number(),
                        baseDesc: z.string(),
                        percentChange: z.number(),
                        percentYearChange: z.number(),
                    }),
                ),
            }),
        ),
        totalItems: z.number(),
        currentPage: z.number(),
        lastPage: z.number(),
        apiUrl: z.string().optional().describe('The CBS API URL that was called'),
        searchedResourceName: z.string().describe('Hebrew name of the price index'),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional().describe('The CBS API URL that was attempted'),
        searchedResourceName: z.string().describe('Hebrew name of the price index'),
    }),
]);

export type GetCbsPriceDataInput = z.infer<typeof getCbsPriceDataInputSchema>;
export type GetCbsPriceDataOutput = z.infer<typeof getCbsPriceDataOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getCbsPriceData = tool({
    description:
        'Get CBS price index values over time. Returns historical index values with dates and percentage changes. Use after browsing price indices to get an index code.',
    inputSchema: getCbsPriceDataInputSchema,
    execute: async ({
        indexCode,
        startPeriod,
        endPeriod,
        last,
        includeCoefficients,
        language,
        searchedResourceName,
    }) => {
        // Construct API URL
        const apiUrl = buildPriceIndexUrl(CBS_PRICE_INDEX_PATHS.PRICE, {
            id: indexCode,
            startPeriod,
            endPeriod,
            last,
            coef: includeCoefficients,
            lang: language,
        });

        try {
            const result = await cbsApi.priceIndex.price({
                id: indexCode,
                startPeriod,
                endPeriod,
                last,
                coef: includeCoefficients,
                lang: language,
            });

            return {
                success: true,
                indices: (result.month ?? []).map((entry) => ({
                    code: entry.code,
                    name: entry.name,
                    data: entry.date.map((d) => ({
                        year: d.year,
                        month: d.month,
                        monthDesc: d.monthDesc,
                        value: d.currBase.value,
                        baseDesc: d.currBase.baseDesc,
                        percentChange: d.percent,
                        percentYearChange: d.percentYear,
                    })),
                })),
                totalItems: result.paging.total_items,
                currentPage: result.paging.current_page,
                lastPage: result.paging.last_page,
                apiUrl,
                searchedResourceName,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
                searchedResourceName,
            };
        }
    },
});
