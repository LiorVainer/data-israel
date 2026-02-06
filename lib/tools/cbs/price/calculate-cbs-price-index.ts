/**
 * Calculate CBS Price Index Tool
 *
 * AI SDK tool for CPI/index-based adjustment calculations
 */

import { tool } from 'ai';
import { z } from 'zod';
import { cbsApi } from '@/lib/api/cbs/client';
import { buildCalculatorUrl } from '@/lib/api/cbs/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const calculateCbsPriceIndexInputSchema = z.object({
    indexCode: z.string().describe('Price index code (get from browseCbsPriceIndices)'),
    startDate: z.string().describe('Start date in yyyy-mm-dd or mm-dd-yyyy format'),
    endDate: z.string().describe('End date in yyyy-mm-dd or mm-dd-yyyy format'),
    amount: z.number().optional().describe('Amount to adjust (e.g., 100000 for calculating inflation-adjusted value)'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
    searchedResourceName: z.string().describe('Hebrew name of the price index. Shown in UI as badge label.'),
});

export const calculateCbsPriceIndexOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        result: z.object({
            originalAmount: z.number().optional(),
            adjustedAmount: z.number().optional(),
            coefficient: z.number().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            indexCode: z.string().optional(),
            startValue: z.number().optional(),
            endValue: z.number().optional(),
        }),
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

export type CalculateCbsPriceIndexInput = z.infer<typeof calculateCbsPriceIndexInputSchema>;
export type CalculateCbsPriceIndexOutput = z.infer<typeof calculateCbsPriceIndexOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const calculateCbsPriceIndex = tool({
    description:
        'Calculate CPI/price index adjustment between two dates. Use to answer questions like "how much would 100,000 NIS from 2015 be worth today?" or "what is the inflation rate between two dates?"',
    inputSchema: calculateCbsPriceIndexInputSchema,
    execute: async ({ indexCode, startDate, endDate, amount, language, searchedResourceName }) => {
        // Construct API URL (calculator endpoint has ID in the path)
        const apiUrl = buildCalculatorUrl(
            { id: indexCode },
            {
                startDate,
                endDate,
                sum: amount,
                lang: language,
            },
        );

        try {
            const result = await cbsApi.priceIndex.calculator({
                id: indexCode,
                startDate,
                endDate,
                sum: amount,
                lang: language,
            });

            return {
                success: true,
                result: {
                    originalAmount: result.originalAmount,
                    adjustedAmount: result.adjustedAmount,
                    coefficient: result.coefficient,
                    startDate: result.startDate,
                    endDate: result.endDate,
                    indexCode: result.indexCode,
                    startValue: result.startValue,
                    endValue: result.endValue,
                },
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
