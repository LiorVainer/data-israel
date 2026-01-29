/**
 * Get CBS Price Data Tool
 *
 * AI SDK tool for retrieving CBS price index values
 */

import { tool } from 'ai';
import { z } from 'zod';
import { cbsApi } from '@/lib/api/cbs/client';

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
});

export const getCbsPriceDataOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        index: z.object({
            code: z.string().optional(),
            name: z.string().optional(),
            base: z.string().optional(),
        }),
        data: z.array(
            z.object({
                date: z.string().optional(),
                value: z.union([z.number(), z.string(), z.null()]).optional(),
                change: z.union([z.number(), z.string(), z.null()]).optional(),
            }),
        ),
        totalItems: z.number().optional(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
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
    execute: async ({ indexCode, startPeriod, endPeriod, last, includeCoefficients, language }) => {
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
                index: {
                    code: result.index?.code,
                    name: result.index?.name,
                    base: result.index?.base,
                },
                data: (result.data ?? []).map((point) => ({
                    date: point.date,
                    value: point.value,
                    change: point.change,
                })),
                totalItems: result.totalItems,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
