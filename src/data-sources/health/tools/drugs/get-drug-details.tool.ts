/**
 * Get Drug Details Tool
 *
 * Retrieve comprehensive drug information by registration number.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { drugsApi } from '../../api/drugs/drugs.client';
import { buildDrugsUrl, buildDrugsPortalUrl, DRUGS_PATHS } from '../../api/drugs/drugs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getDrugDetailsInputSchema = z.object({
    registrationNumber: z.string().describe('Drug registration number (from search results)'),
    ...commonToolInput,
});

export const getDrugDetailsOutputSchema = toolOutputSchema({
    registrationNumber: z.string(),
    hebrewName: z.string(),
    englishName: z.string(),
    activeIngredients: z.array(
        z.object({
            name: z.string(),
            strength: z.string(),
            unit: z.string(),
        }),
    ),
    atcClassifications: z.array(
        z.object({
            code: z.string(),
            name: z.string(),
        }),
    ),
    administrationRoute: z.string(),
    manufacturer: z.object({
        name: z.string(),
        country: z.string(),
    }),
    packages: z.array(
        z.object({
            name: z.string(),
            quantity: z.number(),
            price: z.number().nullable(),
            healthBasketPrice: z.number().nullable(),
        }),
    ),
    prescription: z.boolean(),
    healthBasket: z.boolean(),
    brochureUrl: z.string().nullable(),
    leafletUrl: z.string().nullable(),
    registrationDate: z.string(),
    cancelDate: z.string().nullable(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getDrugDetails = createTool({
    id: 'getDrugDetails',
    description:
        'Get comprehensive details for a specific drug by its registration number. Returns active ingredients, ATC classifications, manufacturer, packages, prices, and documentation links.',
    inputSchema: getDrugDetailsInputSchema,
    outputSchema: getDrugDetailsOutputSchema,
    execute: async ({ registrationNumber }) => {
        const apiUrl = buildDrugsUrl(DRUGS_PATHS.GET_SPECIFIC_DRUG);
        const portalUrl = buildDrugsPortalUrl(registrationNumber);

        try {
            const drug = await drugsApi.info.details({
                dragRegNum: registrationNumber,
            });

            if (!drug?.dragRegNum) {
                return {
                    success: false as const,
                    error: `לא נמצאה תרופה עם מספר רישום "${registrationNumber}".`,
                    apiUrl,
                    portalUrl,
                };
            }

            return {
                success: true as const,
                registrationNumber: drug.dragRegNum,
                hebrewName: drug.dragHebName,
                englishName: drug.dragEngName,
                activeIngredients: (drug.activeIngredients ?? []).map((ai) => ({
                    name: ai.name,
                    strength: ai.strength,
                    unit: ai.unit,
                })),
                atcClassifications: (drug.atcList ?? []).map((atc) => ({
                    code: atc.atcCode,
                    name: atc.atcName,
                })),
                administrationRoute: drug.matanName,
                manufacturer: {
                    name: drug.manufacturer?.name ?? '',
                    country: drug.manufacturer?.country ?? '',
                },
                packages: (drug.packages ?? []).map((pkg) => ({
                    name: pkg.packageName,
                    quantity: pkg.quantity,
                    price: pkg.price,
                    healthBasketPrice: pkg.healthBasketPrice,
                })),
                prescription: drug.prescription,
                healthBasket: drug.healthServices,
                brochureUrl: drug.bpiLink,
                leafletUrl: drug.pilLink,
                registrationDate: drug.registrationDate,
                cancelDate: drug.cancelDate,
                apiUrl,
                portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
                portalUrl,
            };
        }
    },
});

// ============================================================================
// Exported types for typed resolvers
// ============================================================================

export type GetDrugDetailsInput = z.infer<typeof getDrugDetailsInputSchema>;
export type GetDrugDetailsOutput = z.infer<typeof getDrugDetailsOutputSchema>;

// ============================================================================
// Source URL Resolver
// ============================================================================

export const resolveSourceUrl: ToolSourceResolver<GetDrugDetailsInput, GetDrugDetailsOutput> = (input, output) => {
    if (!output.success) return [];
    if (!output.portalUrl) return [];
    const name = input.searchedResourceName ?? output.hebrewName;
    return [
        {
            url: output.portalUrl,
            title: name ? `פרטי תרופה — ${name}` : 'פרטי תרופה',
            urlType: 'portal',
        },
    ];
};
