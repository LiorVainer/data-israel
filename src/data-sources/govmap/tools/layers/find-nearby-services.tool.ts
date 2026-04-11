/**
 * Find Nearby Services Tool
 *
 * Queries emergency and public service layers near a Hebrew address.
 * Groups results by service type, sorted by distance.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import { nadlanApi } from '@/data-sources/govmap/api/nadlan/nadlan.client';
import { buildGovmapPortalUrl } from '@/data-sources/govmap/api/govmap.endpoints';
import { queryAndCleanEntities } from '@/data-sources/govmap/api/layers/layers.client';
import {
    SERVICE_LAYER_IDS,
    cleanEntitySchema,
    emptyServiceResults,
    getServiceCategory,
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
        .max(10000)
        .optional()
        .default(2000)
        .describe('רדיוס חיפוש במטרים (ברירת מחדל: 2000)'),
    ...commonToolInput,
});

const servicesSchema = z.object({
    hospitals: z.array(cleanEntitySchema),
    policeStations: z.array(cleanEntitySchema),
    fireStations: z.array(cleanEntitySchema),
    mdaStations: z.array(cleanEntitySchema),
    gasStations: z.array(cleanEntitySchema),
    banks: z.array(cleanEntitySchema),
    busStops: z.array(cleanEntitySchema),
});

export const findNearbyServicesOutputSchema = toolOutputSchema({
    address: z.string(),
    radius: z.number(),
    services: servicesSchema,
    totalFound: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const findNearbyServices = createTool({
    id: 'findNearbyServices',
    description: 'חיפוש שירותים ציבוריים ליד כתובת — בתי חולים, משטרה, כיבוי אש, מד"א, תחנות דלק, בנקים, תחנות אוטובוס',
    inputSchema,
    outputSchema: findNearbyServicesOutputSchema,
    execute: async ({ address, radius = 2000 }) => {
        const apiUrl = buildEntitiesByPointUrl();

        try {
            // 1. Geocode address
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
                return {
                    success: false as const,
                    error: 'לא ניתן לקבוע קואורדינטות עבור הכתובת.',
                    apiUrl,
                };
            }

            const point: [number, number] = [coords.longitude, coords.latitude];

            // 2. Query all service layers
            const layerResults = await queryAndCleanEntities(point, SERVICE_LAYER_IDS, radius);

            // 3. Group by service type
            const services = emptyServiceResults();

            for (const [layerName, entities] of layerResults) {
                const category = getServiceCategory(layerName);
                if (category) {
                    services[category] = entities;
                }
            }

            const totalFound = typedValues(services).reduce((sum, arr) => sum + arr.length, 0);

            const portalUrl = buildGovmapPortalUrl(coords.longitude, coords.latitude, address, SERVICE_LAYER_IDS);

            return {
                success: true as const,
                address: autocomplete.results[0].text,
                radius,
                services,
                totalFound,
                apiUrl,
                portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : 'שגיאה בשליפת שירותים קרובים',
                apiUrl,
            };
        }
    },
});
