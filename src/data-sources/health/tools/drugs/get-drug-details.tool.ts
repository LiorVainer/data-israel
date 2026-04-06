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
            dosage: z.string(),
        }),
    ),
    atcClassifications: z.array(
        z.object({
            code: z.string(),
            name: z.string(),
        }),
    ),
    administrationRoute: z.string(),
    manufacturer: z.string(),
    packages: z.array(
        z.object({
            description: z.string(),
            unitPrice: z.number().nullable(),
            maxPrice: z.number().nullable(),
        }),
    ),
    prescription: z.boolean(),
    healthBasket: z.boolean(),
    indication: z.string().nullable(),
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
                englishName: drug.dragEnName,
                activeIngredients: (drug.activeMetirals ?? []).map((ai) => ({
                    name: ai.ingredientsDesc,
                    dosage: ai.dosage,
                })),
                atcClassifications: (drug.atc ?? []).map((atc) => ({
                    code: atc.atc5Code ?? atc.atc4Code,
                    name: atc.atc5Name ?? atc.atc4Name,
                })),
                administrationRoute: drug.usageFormHeb,
                manufacturer: drug.regOwnerName ?? '',
                packages: (drug.packages ?? []).map((pkg) => ({
                    description: pkg.packageDesc,
                    unitPrice: pkg.unitPrice,
                    maxPrice: pkg.packageMaxPrice,
                })),
                prescription: drug.isPrescription,
                healthBasket: drug.health,
                indication: drug.dragIndication ?? null,
                registrationDate: drug.regDate ? new Date(drug.regDate).toISOString().split('T')[0] : '',
                cancelDate: drug.bitulDate === '01/01/1900' ? null : drug.bitulDate,
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
