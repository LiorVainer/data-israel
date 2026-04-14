/**
 * Get CBS Price Data Tool
 *
 * AI SDK tool for retrieving CBS price index values
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { cbsApi } from '../../api/cbs.client';
import { buildPriceIndexUrl, CBS_PRICE_INDEX_PATHS } from '../../api/cbs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getCbsPriceDataInputSchema = z.object({
    indexCode: z.string().describe('Price index code (get from browseCbsPriceIndices with mode "indices")'),
    startPeriod: z.string().optional().describe('Start date in mm-yyyy format (e.g., "01-2020")'),
    endPeriod: z.string().optional().describe('End date in mm-yyyy format (e.g., "12-2024")'),
    last: z.number().int().min(1).max(100).optional().describe('Return only the N most recent values (default: 24)'),
    includeCoefficients: z.boolean().optional().describe('Include adjustment coefficients in response'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
    ...commonToolInput,
});

export const getCbsPriceDataOutputSchema = toolOutputSchema({
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
                    percentChange: z.number().nullable(),
                    percentYearChange: z.number().nullable(),
                }),
            ),
        }),
    ),
    totalItems: z.number(),
    currentPage: z.number(),
    lastPage: z.number(),
});

export type GetCbsPriceDataInput = z.infer<typeof getCbsPriceDataInputSchema>;
export type GetCbsPriceDataOutput = z.infer<typeof getCbsPriceDataOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getCbsPriceData = createTool({
    id: 'getCbsPriceData',
    description:
        'Get CBS price index values over time. Returns historical index values with dates and percentage changes. Use after browsing price indices to get an index code.',
    inputSchema: getCbsPriceDataInputSchema,
    outputSchema: getCbsPriceDataOutputSchema,
    execute: async ({ indexCode, startPeriod, endPeriod, last = 24, includeCoefficients, language }) => {
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
                success: true as const,
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
