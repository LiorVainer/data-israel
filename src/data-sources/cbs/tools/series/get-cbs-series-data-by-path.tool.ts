/**
 * Get CBS Series Data by Path Tool
 *
 * AI SDK tool for retrieving CBS time series data by catalog path
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { cbsApi } from '../../api/cbs.client';
import { buildSeriesUrl, CBS_SERIES_PATHS } from '../../api/cbs.endpoints';
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

export const getCbsSeriesDataByPathInputSchema = z.object({
    path: z
        .string()
        .describe(
            'Comma-separated catalog path (e.g., "2,1,1,2,379"). Get path values from browse-cbs-catalog or browse-cbs-catalog-path results.',
        ),
    startPeriod: z.string().optional().describe('Start date in mm-yyyy format (e.g., "01-2000")'),
    endPeriod: z.string().optional().describe('End date in mm-yyyy format (e.g., "12-2020")'),
    last: z.number().int().min(1).max(500).optional().describe('Return only the N most recent data points'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
    page: z.number().int().min(1).optional().describe('Page number (default 1)'),
    pageSize: z.number().int().min(1).max(1000).optional().describe('Items per page (default 100, max 1000)'),
    ...commonToolInput,
});

export const getCbsSeriesDataByPathOutputSchema = toolOutputSchema({
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
});

export type GetCbsSeriesDataByPathInput = z.infer<typeof getCbsSeriesDataByPathInputSchema>;
export type GetCbsSeriesDataByPathOutput = z.infer<typeof getCbsSeriesDataByPathOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getCbsSeriesDataByPath = createTool({
    id: 'getCbsSeriesDataByPath',
    description:
        'Get CBS time series data for all series under a specific catalog path. Returns multiple series with their observations. Use after browsing the catalog to find a path. Supports date range filtering.',
    inputSchema: getCbsSeriesDataByPathInputSchema,
    outputSchema: getCbsSeriesDataByPathOutputSchema,
    execute: async ({ path, startPeriod, endPeriod, last, language, page, pageSize }) => {
        // Construct API URL for reference
        const apiUrl = buildSeriesUrl(CBS_SERIES_PATHS.DATA_PATH, {
            id: path,
            startPeriod,
            endPeriod,
            last,
            lang: language,
            page,
            pagesize: pageSize,
        });

        try {
            const result = await cbsApi.series.dataByPath({
                id: path,
                startPeriod,
                endPeriod,
                last,
                lang: language,
                page,
                pagesize: pageSize,
            });

            const { DataSet } = result;

            if (!DataSet?.Series?.length) {
                return {
                    success: false as const,
                    error: 'No series data returned for this path. The path may be a category, not a leaf series — try drilling deeper.',
                    apiUrl,
                };
            }

            return {
                success: true as const,
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
        title: name ? `סדרה סטטיסטית — ${name}` : 'סדרה סטטיסטית - הלמ"ס',
        urlType: 'api',
    };
};
