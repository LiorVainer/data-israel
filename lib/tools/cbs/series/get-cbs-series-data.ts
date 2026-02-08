/**
 * Get CBS Series Data Tool
 *
 * AI SDK tool for retrieving CBS time series data by series ID
 */

import { tool } from 'ai';
import { z } from 'zod';
import { cbsApi } from '@/lib/api/cbs/client';
import { buildSeriesUrl, CBS_SERIES_PATHS } from '@/lib/api/cbs/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getCbsSeriesDataInputSchema = z.object({
    seriesId: z.string().describe('Series code/ID (get from catalog browsing)'),
    startPeriod: z.string().optional().describe('Start date in mm-yyyy format (e.g., "01-2020")'),
    endPeriod: z.string().optional().describe('End date in mm-yyyy format (e.g., "12-2024")'),
    last: z.number().int().min(1).max(500).optional().describe('Return only the N most recent data points'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
    searchedResourceName: z
        .string()
        .describe('Hebrew display name of the series (from catalog browsing). Shown in UI as badge label.'),
});

export const getCbsSeriesDataOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        series: z.array(
            z.object({
                id: z.number(),
                unit: z.string(),
                frequency: z.string(),
                lastUpdate: z.string(),
                precision: z.number(),
                path: z.string(),
                observations: z.array(
                    z.object({
                        period: z.string(),
                        value: z.number(),
                    }),
                ),
            }),
        ),
        totalItems: z.number(),
        currentPage: z.number(),
        lastPage: z.number(),
        apiUrl: z.string().optional(),
        searchedResourceName: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional(),
        searchedResourceName: z.string(),
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
    execute: async ({ seriesId, startPeriod, endPeriod, last, language, searchedResourceName }) => {
        // Construct API URL for reference
        const apiUrl = buildSeriesUrl(CBS_SERIES_PATHS.DATA_LIST, {
            id: seriesId,
            startPeriod,
            endPeriod,
            last,
            lang: language,
        });

        try {
            const result = await cbsApi.series.data({
                id: seriesId,
                startPeriod,
                endPeriod,
                last,
                lang: language,
            });

            const { DataSet } = result;

            return {
                success: true,
                series: DataSet.Series.map((s) => ({
                    id: s.id,
                    unit: s.unit.name,
                    frequency: s.time.name,
                    lastUpdate: s.update,
                    precision: s.precis,
                    path: [s.path.level1, s.path.level2, s.path.level3, s.path.level4, s.path.name_id]
                        .map((l) => l.name)
                        .filter(Boolean)
                        .join(' > '),
                    observations: s.obs.map((o) => ({
                        period: o.TimePeriod,
                        value: o.Value,
                    })),
                })),
                totalItems: DataSet.paging.total_items,
                currentPage: DataSet.paging.current_page,
                lastPage: DataSet.paging.last_page,
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
