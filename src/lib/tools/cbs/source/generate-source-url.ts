/**
 * Generate CBS Source URL Tool
 *
 * Generates a clickable CBS (Central Bureau of Statistics) source URL
 * so users can view the statistical data source directly.
 */

import { tool } from 'ai';
import { z } from 'zod';
import {
    buildSeriesUrl,
    CBS_SERIES_PATHS,
    buildPriceIndexUrl,
    CBS_PRICE_INDEX_PATHS,
    buildDictionaryUrl,
} from '@/lib/api/cbs/endpoints';

export const generateCbsSourceUrlInputSchema = z.object({
    sourceType: z.enum(['series', 'price-index', 'localities']),
    seriesId: z.string().optional().describe('Series code (required for sourceType "series")'),
    indexId: z.string().optional().describe('Price index code (required for sourceType "price-index")'),
    query: z.string().optional().describe('Search term (for localities)'),
    title: z.string().describe('Hebrew display title for the source link'),
});

export const generateCbsSourceUrlOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        url: z.string(),
        title: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export type GenerateCbsSourceUrlInput = z.infer<typeof generateCbsSourceUrlInputSchema>;
export type GenerateCbsSourceUrlOutput = z.infer<typeof generateCbsSourceUrlOutputSchema>;

export const generateCbsSourceUrl = tool({
    description: 'Generate a CBS source URL so users can view the statistical data source.',
    inputSchema: generateCbsSourceUrlInputSchema,
    execute: async ({ sourceType, seriesId, indexId, query, title }) => {
        let url: string;
        switch (sourceType) {
            case 'series':
                url = buildSeriesUrl(CBS_SERIES_PATHS.DATA_LIST, { id: seriesId, lang: 'he' });
                break;
            case 'price-index':
                url = buildPriceIndexUrl(CBS_PRICE_INDEX_PATHS.PRICE, { id: indexId, lang: 'he' });
                break;
            case 'localities':
                url = buildDictionaryUrl({ subject: 'geo', resource: 'localities' }, { q: query, lang: 'he' });
                break;
        }
        return { success: true as const, url, title };
    },
});
