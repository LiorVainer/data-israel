/**
 * Get Location Context Tool
 *
 * Queries neighborhood and statistical area layers near a Hebrew address.
 * Returns demographic and geographic context for the location.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import { nadlanApi } from '@/data-sources/govmap/api/nadlan/nadlan.client';
import { buildGovmapPortalUrl } from '@/data-sources/govmap/api/govmap.endpoints';
import { queryAndCleanEntities } from '@/data-sources/govmap/api/layers/layers.client';
import {
    CONTEXT_LAYER_IDS,
    neighborhoodFieldsSchema,
    statisticalAreaFieldsSchema,
} from '@/data-sources/govmap/api/layers/layers.constants';
import type { NeighborhoodFields, StatisticalAreaFields } from '@/data-sources/govmap/api/layers/layers.constants';
import { buildEntitiesByPointUrl } from '@/data-sources/govmap/api/layers/layers.endpoints';

// ============================================================================
// Schemas
// ============================================================================

const inputSchema = z.object({
    address: z.string().describe('כתובת מלאה בעברית — רחוב + מספר + עיר (לדוגמה: "דיזנגוף 50 תל אביב")'),
    radius: z.number().int().min(10).max(5000).optional().default(500).describe('רדיוס חיפוש במטרים (ברירת מחדל: 500)'),
    ...commonToolInput,
});

export const getLocationContextOutputSchema = toolOutputSchema({
    address: z.string(),
    neighborhood: z
        .object({
            name: z.string(),
            settlement: z.string(),
        })
        .optional(),
    statisticalArea: z
        .object({
            code: z.string().optional(),
            population: z.string().optional(),
            district: z.string().optional(),
            subDistrict: z.string().optional(),
            naturalRegion: z.string().optional(),
            mainReligion: z.string().optional(),
            settlementType: z.string().optional(),
            yearEstablished: z.string().optional(),
        })
        .optional(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getLocationContext = createTool({
    id: 'getLocationContext',
    description: 'מידע כללי על אזור לפי כתובת — שכונה, נתונים דמוגרפיים, מחוז, אזור טבעי',
    inputSchema,
    outputSchema: getLocationContextOutputSchema,
    execute: async ({ address, radius = 500 }) => {
        const apiUrl = buildEntitiesByPointUrl();

        try {
            const autocomplete = await nadlanApi.autocompleteAddress(address);
            if (!autocomplete.results.length) {
                return {
                    success: false as const,
                    error: `לא נמצאה כתובת "${address}". נסה כתובת מלאה עם רחוב, מספר ועיר.`,
                    apiUrl,
                };
            }

            const coords = autocomplete.results[0].coordinates;
            if (!coords) {
                return { success: false as const, error: 'לא ניתן לקבוע קואורדינטות עבור הכתובת.', apiUrl };
            }

            const point: [number, number] = [coords.longitude, coords.latitude];
            const layerResults = await queryAndCleanEntities(point, CONTEXT_LAYER_IDS, radius);

            // 3. Extract neighborhood and statistical area
            let neighborhood: NeighborhoodFields | undefined;
            let statisticalArea: StatisticalAreaFields | undefined;

            for (const [layerName, entities] of layerResults) {
                const lowerName = layerName.toLowerCase();

                if (lowerName.includes('neighborhood') || lowerName.includes('שכונ')) {
                    const first = entities[0];
                    if (first && !neighborhood) {
                        const nParsed = neighborhoodFieldsSchema.safeParse(first.fields);
                        if (nParsed.success) neighborhood = nParsed.data;
                    }
                } else if (lowerName.includes('statistic') || lowerName.includes('סטטיסט')) {
                    const first = entities[0];
                    if (first && !statisticalArea) {
                        const sParsed = statisticalAreaFieldsSchema.safeParse(first.fields);
                        if (sParsed.success) statisticalArea = sParsed.data;
                    }
                }
            }

            const portalUrl = buildGovmapPortalUrl(coords.longitude, coords.latitude, address, CONTEXT_LAYER_IDS);

            return {
                success: true as const,
                address: autocomplete.results[0].text,
                neighborhood,
                statisticalArea,
                apiUrl,
                portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : 'שגיאה בשליפת מידע אזורי',
                apiUrl,
            };
        }
    },
});
