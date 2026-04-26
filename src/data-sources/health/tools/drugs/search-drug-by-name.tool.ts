/**
 * Search Drug by Name Tool
 *
 * Search for drugs by their Hebrew or English name in the Israeli drugs registry.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { drugsApi } from '../../api/drugs/drugs.client';
import { buildDrugsUrl, DRUGS_PATHS } from '../../api/drugs/drugs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const searchDrugByNameInputSchema = z.object({
    drugName: z.string().describe('Drug name to search for (Hebrew or English)'),
    prescription: z
        .boolean()
        .optional()
        .default(false)
        .describe('Filter: false = all drugs (default), true = OTC only'),
    healthServices: z.boolean().optional().default(false).describe('Filter by health basket inclusion'),
    page: z.number().int().min(1).optional().default(1).describe('Page number (starts at 1)'),
    ...commonToolInput,
});

export const searchDrugByNameOutputSchema = toolOutputSchema({
    drugs: z.array(
        z.object({
            registrationNumber: z.string(),
            hebrewName: z.string().nullable(),
            englishName: z.string().nullable(),
            activeIngredients: z.string().nullable(),
            prescription: z.boolean().nullable(),
            healthBasket: z.boolean().nullable(),
            manufacturer: z.string().nullable(),
            administrationRoute: z.string().nullable(),
        }),
    ),
    totalResults: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const searchDrugByName = createTool({
    id: 'searchDrugByName',
    description:
        'Search for drugs by name in the Israeli Ministry of Health drug registry. Returns matching medications with basic details. Use for finding specific drugs or browsing by partial name.',
    inputSchema: searchDrugByNameInputSchema,
    outputSchema: searchDrugByNameOutputSchema,
    execute: async ({ drugName, prescription, healthServices, page }) => {
        const apiUrl = buildDrugsUrl(DRUGS_PATHS.SEARCH_BY_NAME);

        try {
            const result = await drugsApi.search.byName({
                val: drugName,
                prescription: prescription ?? false,
                healthServices: healthServices ?? false,
                pageIndex: page ?? 1,
                orderBy: 0,
            });

            if (!result.results?.length) {
                return {
                    success: false as const,
                    error: `לא נמצאו תרופות בחיפוש "${drugName}".`,
                    apiUrl,
                };
            }

            const totalResults = result.results[0]?.results ?? result.results.length;

            return {
                success: true as const,
                drugs: result.results.map((d) => ({
                    registrationNumber: d.dragRegNum,
                    hebrewName: d.dragHebName,
                    englishName: d.dragEnName,
                    activeIngredients: d.activeComponentsDisplayName ?? null,
                    prescription: d.prescription,
                    healthBasket: d.health,
                    manufacturer: d.dragRegOwner,
                    administrationRoute: d.route,
                })),
                totalResults,
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
// Exported types for typed resolvers
// ============================================================================

export type SearchDrugByNameInput = z.infer<typeof searchDrugByNameInputSchema>;
export type SearchDrugByNameOutput = z.infer<typeof searchDrugByNameOutputSchema>;

// ============================================================================
// Source URL Resolver
// ============================================================================

// fallow-ignore-next-line duplicate-exports
export const resolveSourceUrl: ToolSourceResolver<SearchDrugByNameInput, SearchDrugByNameOutput> = (input, output) => {
    if (!output.success) return [];
    const name = input.searchedResourceName ?? input.drugName;
    return [
        {
            url: buildDrugsUrl(DRUGS_PATHS.SEARCH_BY_NAME),
            title: name ? `חיפוש תרופה — ${name}` : 'חיפוש תרופות',
            urlType: 'api',
        },
    ];
};
