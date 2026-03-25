/**
 * Search Drug by Name Tool
 *
 * Search for drugs by their Hebrew or English name in the Israeli drugs registry.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { drugsApi } from '../api/drugs.client';
import { buildDrugsUrl, DRUGS_PATHS } from '../api/drugs.endpoints';
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
            hebrewName: z.string(),
            englishName: z.string(),
            activeIngredients: z.string(),
            prescription: z.boolean(),
            healthBasket: z.boolean(),
            manufacturer: z.string(),
            administrationRoute: z.string(),
        }),
    ),
    totalCount: z.number(),
    currentPage: z.number(),
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

            return {
                success: true as const,
                drugs: result.results.map((d) => ({
                    registrationNumber: d.dragRegNum,
                    hebrewName: d.dragHebName,
                    englishName: d.dragEngName,
                    activeIngredients: d.activeIngredients,
                    prescription: d.prescription,
                    healthBasket: d.healthServices,
                    manufacturer: d.manufacturer,
                    administrationRoute: d.matanName,
                })),
                totalCount: result.totalCount,
                currentPage: result.currentPage,
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

export const resolveSourceUrl: ToolSourceResolver = (input, output) => {
    if (!isRecord(output) || output.success === false) return null;
    const name = getString(input, 'searchedResourceName') ?? getString(input, 'drugName');
    return {
        url: buildDrugsUrl(DRUGS_PATHS.SEARCH_BY_NAME),
        title: name ? `חיפוש תרופה — ${name}` : 'חיפוש תרופות',
        urlType: 'api',
    };
};
