/**
 * Suggest Drug Names Tool
 *
 * Autocomplete drug name suggestions for partial queries.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { drugsApi } from '../api/drugs.client';
import { buildDrugsUrl, DRUGS_PATHS } from '../api/drugs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const suggestDrugNamesInputSchema = z.object({
    query: z.string().max(100).describe('Partial drug name to get suggestions for'),
    searchType: z
        .enum(['trade_names', 'active_ingredients', 'both'])
        .optional()
        .default('both')
        .describe('What to search: trade names, active ingredients, or both'),
    ...commonToolInput,
});

export const suggestDrugNamesOutputSchema = toolOutputSchema({
    suggestions: z.array(z.string()),
    totalCount: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const suggestDrugNames = createTool({
    id: 'suggestDrugNames',
    description:
        'Get autocomplete suggestions for partial drug names. Use before searchDrugByName to help users find the exact drug name.',
    inputSchema: suggestDrugNamesInputSchema,
    outputSchema: suggestDrugNamesOutputSchema,
    execute: async ({ query, searchType }) => {
        const apiUrl = buildDrugsUrl(DRUGS_PATHS.SEARCH_AUTOCOMPLETE);

        try {
            const result = await drugsApi.search.autocomplete({
                val: query,
                isSearchTradeName: searchType === 'active_ingredients' ? '0' : '1',
                isSearchTradeMarkiv: searchType === 'active_ingredients' ? '1' : '0',
            });

            const suggestions = result.results ?? [];

            return {
                success: true as const,
                suggestions,
                totalCount: suggestions.length,
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
