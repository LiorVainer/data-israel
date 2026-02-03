/**
 * Search CBS Localities Tool
 *
 * AI SDK tool for searching Israeli localities from the CBS dictionary
 */

import { tool } from 'ai';
import { z } from 'zod';
import { cbsApi } from '@/lib/api/cbs/client';
import { buildDictionaryUrl } from '@/lib/api/cbs/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const searchCbsLocalitiesInputSchema = z.object({
    query: z.string().optional().describe('Search text for locality name (Hebrew or English)'),
    matchType: z
        .enum(['BEGINS_WITH', 'CONTAINS', 'EQUALS'])
        .optional()
        .describe('How to match the search text (default: CONTAINS)'),
    filter: z.string().optional().describe('Filter expression (e.g., "district=1" for Jerusalem district)'),
    page: z.number().int().min(1).optional().describe('Page number (default 1)'),
    pageSize: z.number().int().min(1).max(250).optional().describe('Items per page (default 100, max 250)'),
});

export const searchCbsLocalitiesOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        localities: z.array(
            z.object({
                id: z.union([z.string(), z.number()]).optional(),
                nameHebrew: z.string().optional(),
                nameEnglish: z.string().optional(),
                district: z.string().optional(),
                region: z.string().optional(),
                population: z.number().optional(),
                populationGroup: z.string().optional(),
                municipalStatus: z.string().optional(),
            }),
        ),
        total: z.number().optional(),
        page: z.number().optional(),
        apiUrl: z.string().optional(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional(),
    }),
]);

export type SearchCbsLocalitiesInput = z.infer<typeof searchCbsLocalitiesInputSchema>;
export type SearchCbsLocalitiesOutput = z.infer<typeof searchCbsLocalitiesOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const searchCbsLocalities = tool({
    description:
        'Search Israeli localities (cities, towns, villages) from the CBS dictionary. Returns name, district, region, population, and other demographic data. Use for questions about Israeli cities and settlements.',
    inputSchema: searchCbsLocalitiesInputSchema,
    execute: async ({ query, matchType, filter, page, pageSize }) => {
        // Construct API URL for transparency
        const apiUrl = buildDictionaryUrl(
            { subject: 'geo', resource: 'localities' },
            {
                q: query,
                string_match_type: matchType ?? 'CONTAINS',
                filter,
                page,
                pagesize: pageSize,
                expand: true,
            },
        );

        try {
            const result = await cbsApi.dictionary.search('geo', 'localities', {
                q: query,
                string_match_type: matchType ?? 'CONTAINS',
                filter,
                page,
                page_size: pageSize,
                expand: true,
            });

            const { dictionary } = result;
            const items = dictionary.data.localities.items;
            const loc = items.localities;

            const localities = [
                {
                    id: loc.ID.id,
                    nameHebrew: loc.name_heb,
                    nameEnglish: loc.name_eng ?? undefined,
                    district: items.districts?.name_heb ?? undefined,
                    region: items.regions?.name_heb ?? undefined,
                    population: loc.total_population ? Number(loc.total_population) : undefined,
                    populationGroup: undefined,
                    municipalStatus: items.municipal_or_council_status?.name_heb ?? undefined,
                },
            ];

            return {
                success: true,
                localities,
                total: Number(dictionary.paging.total_items),
                page: Number(dictionary.paging.current_page),
                apiUrl,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
            };
        }
    },
});
