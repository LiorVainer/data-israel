/**
 * Search Drug by Symptom Tool
 *
 * Find drugs that treat a specific symptom using primary category and secondary symptom.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { drugsApi } from '../../api/drugs/drugs.client';
import { buildDrugsUrl, DRUGS_PATHS } from '../../api/drugs/drugs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const searchDrugBySymptomInputSchema = z.object({
    symptomCategory: z.string().describe('Primary symptom category ID (Hebrew, from browseSymptoms categoryName)'),
    symptomId: z.number().int().describe('Secondary symptom ID (from browseSymptoms symptomId)'),
    prescription: z.boolean().optional().default(false).describe('Filter: false = all drugs, true = OTC only'),
    healthServices: z.boolean().optional().default(false).describe('Filter by health basket inclusion'),
    page: z.number().int().min(1).optional().default(1).describe('Page number (starts at 1)'),
    ...commonToolInput,
});

export const searchDrugBySymptomOutputSchema = toolOutputSchema({
    drugs: z.array(
        z.object({
            registrationNumber: z.string(),
            hebrewName: z.string().nullable(),
            englishName: z.string().nullable(),
            activeIngredients: z.string().nullable(),
            prescription: z.boolean().nullable(),
            healthBasket: z.boolean().nullable(),
            administrationRoute: z.string().nullable(),
        }),
    ),
    totalCount: z.number(),
    currentPage: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const searchDrugBySymptom = createTool({
    id: 'searchDrugBySymptom',
    description:
        'Find drugs that treat a specific symptom. Requires a symptom category and symptom ID from browseSymptoms results. Returns matching medications.',
    inputSchema: searchDrugBySymptomInputSchema,
    outputSchema: searchDrugBySymptomOutputSchema,
    execute: async ({ symptomCategory, symptomId, prescription, healthServices, page }) => {
        const apiUrl = buildDrugsUrl(DRUGS_PATHS.SEARCH_BY_SYMPTOM);

        try {
            const result = await drugsApi.search.bySymptom({
                primarySymp: symptomCategory,
                secondarySymp: String(symptomId),
                prescription: prescription ?? false,
                healthServices: healthServices ?? false,
                pageIndex: page ?? 1,
                orderBy: 0,
            });

            if (!result.results?.length) {
                return {
                    success: false as const,
                    error: `לא נמצאו תרופות לסימפטום זה.`,
                    apiUrl,
                };
            }

            return {
                success: true as const,
                drugs: result.results.map((d) => ({
                    registrationNumber: d.dragRegNum ?? '',
                    hebrewName: d.dragHebName ?? '',
                    englishName: d.dragEngName ?? '',
                    activeIngredients: d.activeIngredients ?? '',
                    prescription: d.prescription ?? false,
                    healthBasket: d.healthServices ?? false,
                    administrationRoute: d.matanName ?? '',
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
