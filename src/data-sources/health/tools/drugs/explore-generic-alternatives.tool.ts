/**
 * Explore Generic Alternatives Tool
 *
 * Advanced search for drugs by active ingredient, ATC code, or administration route.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { drugsApi } from '../../api/drugs/drugs.client';
import { buildDrugsUrl, DRUGS_PATHS } from '../../api/drugs/drugs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const exploreGenericAlternativesInputSchema = z.object({
    activeIngredient: z.string().optional().describe('Active ingredient name to search for'),
    atcCode: z.string().optional().describe('ATC therapeutic classification code (4 characters, e.g., "N02B")'),
    administrationRouteId: z
        .number()
        .int()
        .optional()
        .describe('Administration route ID (from exploreTherapeuticCategories)'),
    prescription: z.boolean().optional().default(false).describe('Filter: false = all drugs, true = OTC only'),
    healthServices: z.boolean().optional().default(false).describe('Filter by health basket inclusion'),
    page: z.number().int().min(1).optional().default(1).describe('Page number (starts at 1)'),
    ...commonToolInput,
});

export const exploreGenericAlternativesOutputSchema = toolOutputSchema({
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
    totalCount: z.number(),
    currentPage: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const exploreGenericAlternatives = createTool({
    id: 'exploreGenericAlternatives',
    description:
        'Search for generic alternatives and similar medications by active ingredient, ATC therapeutic code, or administration route. At least one search criterion is required.',
    inputSchema: exploreGenericAlternativesInputSchema,
    outputSchema: exploreGenericAlternativesOutputSchema,
    execute: async ({ activeIngredient, atcCode, administrationRouteId, page }) => {
        const apiUrl = buildDrugsUrl(DRUGS_PATHS.SEARCH_GENERIC);

        if (!activeIngredient && !atcCode && !administrationRouteId) {
            return {
                success: false as const,
                error: 'יש לציין לפחות קריטריון חיפוש אחד (חומר פעיל, קוד ATC, או דרך מתן).',
                apiUrl,
            };
        }

        try {
            const result = await drugsApi.search.generic({
                val: activeIngredient ?? '',
                atcId: atcCode ?? null,
                matanId: administrationRouteId ?? null,
                pageIndex: page ?? 1,
                orderBy: 0,
            });

            if (!result.results?.length) {
                return {
                    success: false as const,
                    error: 'לא נמצאו תרופות לקריטריונים שצוינו.',
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
