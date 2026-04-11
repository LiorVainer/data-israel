/**
 * Find Nearby Tourism Tool
 *
 * Queries tourism and leisure layers near a Hebrew address.
 * Groups results by attraction type, sorted by distance.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import { nadlanApi } from '@/data-sources/govmap/api/nadlan/nadlan.client';
import { buildGovmapPortalUrl } from '@/data-sources/govmap/api/govmap.endpoints';
import { queryAndCleanEntities } from '@/data-sources/govmap/api/layers/layers.client';
import {
    TOURISM_LAYER_IDS,
    cleanEntitySchema,
    emptyTourismResults,
    getTourismCategory,
} from '@/data-sources/govmap/api/layers/layers.constants';
import { buildEntitiesByPointUrl } from '@/data-sources/govmap/api/layers/layers.endpoints';
import { typedValues } from '@/lib/typescript/typed-object';

// ============================================================================
// Schemas
// ============================================================================

const inputSchema = z.object({
    address: z.string().describe('כתובת מלאה בעברית — רחוב + מספר + עיר (לדוגמה: "דיזנגוף 50 תל אביב")'),
    radius: z
        .number()
        .int()
        .min(100)
        .max(50000)
        .optional()
        .default(5000)
        .describe('רדיוס חיפוש במטרים (ברירת מחדל: 5000)'),
    ...commonToolInput,
});

const tourismServicesSchema = z.object({
    hotels: z.array(cleanEntitySchema),
    zimmers: z.array(cleanEntitySchema),
    attractions: z.array(cleanEntitySchema),
    wineries: z.array(cleanEntitySchema),
    archaeologicalSites: z.array(cleanEntitySchema),
    sportsFacilities: z.array(cleanEntitySchema),
});

export const findNearbyTourismOutputSchema = toolOutputSchema({
    address: z.string(),
    radius: z.number(),
    tourism: tourismServicesSchema,
    totalFound: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const findNearbyTourism = createTool({
    id: 'findNearbyTourism',
    description: 'חיפוש אטרקציות תיירות ופנאי ליד כתובת — בתי מלון, צימרים, אטרקציות, יקבים, אתרי עתיקות, מתקני ספורט',
    inputSchema,
    outputSchema: findNearbyTourismOutputSchema,
    execute: async ({ address, radius = 5000 }) => {
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
            const layerResults = await queryAndCleanEntities(point, TOURISM_LAYER_IDS, radius);

            const tourism = emptyTourismResults();

            for (const [layerName, entities] of layerResults) {
                const category = getTourismCategory(layerName);
                if (category) {
                    tourism[category] = entities;
                }
            }

            const totalFound = typedValues(tourism).reduce((sum, arr) => sum + arr.length, 0);
            const portalUrl = buildGovmapPortalUrl(coords.longitude, coords.latitude, address, TOURISM_LAYER_IDS);

            return {
                success: true as const,
                address: autocomplete.results[0].text,
                radius,
                tourism,
                totalFound,
                apiUrl,
                portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : 'שגיאה בשליפת אטרקציות תיירות',
                apiUrl,
            };
        }
    },
});
