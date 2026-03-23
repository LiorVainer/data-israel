/**
 * Calculate CBS Price Index Tool
 *
 * AI SDK tool for CPI/index-based adjustment calculations
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { cbsApi } from '../../api/cbs.client';
import { buildCalculatorUrl } from '../../api/cbs.endpoints';
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

export const calculateCbsPriceIndexInputSchema = z.object({
    indexCode: z.string().describe('Price index code (get from browseCbsPriceIndices)'),
    startDate: z.string().describe('Start date in yyyy-mm-dd or mm-dd-yyyy format'),
    endDate: z.string().describe('End date in yyyy-mm-dd or mm-dd-yyyy format'),
    amount: z.number().optional().describe('Amount to adjust (e.g., 100000 for calculating inflation-adjusted value)'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
    ...commonToolInput,
});

export const calculateCbsPriceIndexOutputSchema = toolOutputSchema({
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
});

export type CalculateCbsPriceIndexInput = z.infer<typeof calculateCbsPriceIndexInputSchema>;
export type CalculateCbsPriceIndexOutput = z.infer<typeof calculateCbsPriceIndexOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const calculateCbsPriceIndex = createTool({
    id: 'calculateCbsPriceIndex',
    description:
        'Calculate CPI/price index adjustment between two dates. Use to answer questions like "how much would 100,000 NIS from 2015 be worth today?" or "what is the inflation rate between two dates?"',
    inputSchema: calculateCbsPriceIndexInputSchema,
    outputSchema: calculateCbsPriceIndexOutputSchema,
    execute: async ({ indexCode, startDate, endDate, amount, language }) => {
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
                success: true as const,
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

/** Source URL resolver — co-located with the tool that produces the data */
export const resolveSourceUrl: ToolSourceResolver = (input, output) => {
    const apiUrl = getString(output, 'apiUrl');
    if (!apiUrl) return null;
    const name = getString(input, 'searchedResourceName');
    return {
        url: apiUrl,
        title: name ? `מחשבון הצמדה — ${name}` : 'מחשבון הצמדה - הלמ"ס',
        urlType: 'api',
    };
};
