/**
 * Explore Therapeutic Categories Tool
 *
 * Get all ATC therapeutic classification codes and administration routes.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { drugsApi } from '../../api/drugs/drugs.client';
import { buildDrugsUrl, DRUGS_PATHS } from '../../api/drugs/drugs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const exploreTherapeuticCategoriesInputSchema = z.object({
    type: z
        .enum(['atc', 'routes'])
        .describe('What to explore: "atc" for therapeutic classification codes, "routes" for administration routes'),
    ...commonToolInput,
});

export const exploreTherapeuticCategoriesOutputSchema = toolOutputSchema({
    items: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
        }),
    ),
    totalCount: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const exploreTherapeuticCategories = createTool({
    id: 'exploreTherapeuticCategories',
    description:
        'Discover available therapeutic categories (ATC codes) or administration routes. Use before exploreGenericAlternatives to get valid ATC codes or route IDs.',
    inputSchema: exploreTherapeuticCategoriesInputSchema,
    outputSchema: exploreTherapeuticCategoriesOutputSchema,
    execute: async ({ type }) => {
        const apiUrl =
            type === 'atc' ? buildDrugsUrl(DRUGS_PATHS.GET_ATC_LIST) : buildDrugsUrl(DRUGS_PATHS.GET_MATAN_LIST);

        try {
            if (type === 'atc') {
                const result = await drugsApi.discovery.atcList();
                const items = result.results ?? [];

                return {
                    success: true as const,
                    items: items.map((a) => ({
                        id: a.id,
                        name: a.text,
                    })),
                    totalCount: items.length,
                    apiUrl,
                };
            }

            const result = await drugsApi.discovery.adminRoutes();
            const items = result.results ?? [];

            return {
                success: true as const,
                items: items.map((r) => ({
                    id: String(r.matanId),
                    name: r.matanName,
                })),
                totalCount: items.length,
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
