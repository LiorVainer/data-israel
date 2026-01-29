/**
 * Get CBS Series Data Tool
 *
 * AI SDK tool for retrieving CBS time series data by series ID
 */

import { tool } from 'ai';
import { z } from 'zod';
import { cbsApi } from '@/lib/api/cbs/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getCbsSeriesDataInputSchema = z.object({
    seriesId: z.string().describe('Series code/ID (get from catalog browsing)'),
    startPeriod: z.string().optional().describe('Start date in mm-yyyy format (e.g., "01-2020")'),
    endPeriod: z.string().optional().describe('End date in mm-yyyy format (e.g., "12-2024")'),
    last: z.number().int().min(1).max(500).optional().describe('Return only the N most recent data points'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
});

export const getCbsSeriesDataOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        series: z.object({
            id: z.string().optional(),
            name: z.string().optional(),
            unit: z.string().optional(),
            frequency: z.string().optional(),
            lastUpdate: z.string().optional(),
        }),
        data: z.array(
            z.object({
                date: z.string().optional(),
                value: z.union([z.number(), z.string(), z.null()]).optional(),
            }),
        ),
        totalItems: z.number().optional(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export type GetCbsSeriesDataInput = z.infer<typeof getCbsSeriesDataInputSchema>;
export type GetCbsSeriesDataOutput = z.infer<typeof getCbsSeriesDataOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getCbsSeriesData = tool({
    description:
        'Get CBS time series data points for a specific series ID. Returns historical values with dates. Use after browsing the catalog to find a series code. Supports date range filtering and fetching latest N entries.',
    inputSchema: getCbsSeriesDataInputSchema,
    execute: async ({ seriesId, startPeriod, endPeriod, last, language }) => {
        try {
            const result = await cbsApi.series.data({
                id: seriesId,
                startPeriod,
                endPeriod,
                last,
                lang: language,
            });

            return {
                success: true,
                series: {
                    id: result.series?.id ?? result.series?.code,
                    name: result.series?.name,
                    unit: result.series?.unit,
                    frequency: result.series?.frequency,
                    lastUpdate: result.series?.lastUpdate,
                },
                data: (result.data ?? []).map((point) => ({
                    date: point.date,
                    value: point.value,
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
