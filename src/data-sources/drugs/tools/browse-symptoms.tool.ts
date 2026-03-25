/**
 * Browse Symptoms Tool
 *
 * Browse the symptom hierarchy to find categories and symptoms for drug search.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { drugsApi } from '../api/drugs.client';
import { buildDrugsUrl, DRUGS_PATHS } from '../api/drugs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const browseSymptomsInputSchema = z.object({
    includePopular: z.boolean().optional().default(false).describe('Also include popular/trending symptoms'),
    ...commonToolInput,
});

export const browseSymptomsOutputSchema = toolOutputSchema({
    categories: z.array(
        z.object({
            categoryName: z.string(),
            symptoms: z.array(
                z.object({
                    symptomId: z.number(),
                    symptomName: z.string(),
                }),
            ),
        }),
    ),
    popularSymptoms: z
        .array(
            z.object({
                symptomId: z.number(),
                symptomName: z.string(),
            }),
        )
        .optional(),
    totalCategories: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const browseSymptoms = createTool({
    id: 'browseSymptoms',
    description:
        'Browse the complete symptom hierarchy for drug search. Returns categories with nested symptoms. Use the category name and symptom ID with searchDrugBySymptom.',
    inputSchema: browseSymptomsInputSchema,
    outputSchema: browseSymptomsOutputSchema,
    execute: async ({ includePopular }) => {
        const apiUrl = buildDrugsUrl(DRUGS_PATHS.GET_BY_SYMPTOM);

        try {
            const hierarchyResult = await drugsApi.discovery.symptomHierarchy({
                prescription: false,
            });

            const categories = (hierarchyResult.results ?? []).map((cat) => ({
                categoryName: cat.bySymptomMain,
                symptoms: (cat.list ?? []).map((s) => ({
                    symptomId: s.bySymptomSecond,
                    symptomName: s.bySymptomName,
                })),
            }));

            let popularSymptoms: Array<{ symptomId: number; symptomName: string }> | undefined;

            if (includePopular) {
                try {
                    const popularResult = await drugsApi.discovery.popularSymptoms({
                        rowCount: 20,
                    });
                    popularSymptoms = (popularResult.results ?? []).map((s) => ({
                        symptomId: s.bySymptomSecond,
                        symptomName: s.bySymptomName,
                    }));
                } catch {
                    // Popular symptoms are optional — ignore failures
                }
            }

            if (categories.length === 0) {
                return {
                    success: false as const,
                    error: 'לא נמצאו קטגוריות סימפטומים.',
                    apiUrl,
                };
            }

            return {
                success: true as const,
                categories,
                popularSymptoms,
                totalCategories: categories.length,
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
