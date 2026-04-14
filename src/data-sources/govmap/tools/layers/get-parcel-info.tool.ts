/**
 * Get Parcel Info Tool
 *
 * Queries cadastral parcel layers near a Hebrew address.
 * Returns gush/helka data, neighborhoods, and block information.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import { nadlanApi } from '@/data-sources/govmap/api/nadlan/nadlan.client';
import { buildGovmapPortalUrl } from '@/data-sources/govmap/api/govmap.endpoints';
import { queryAndCleanEntities } from '@/data-sources/govmap/api/layers/layers.client';
import {
    PARCEL_LAYER_IDS,
    parcelFieldsSchema,
    blockFieldsSchema,
    neighborhoodFieldsSchema,
} from '@/data-sources/govmap/api/layers/layers.constants';
import type { ParcelFields, BlockFields, NeighborhoodFields } from '@/data-sources/govmap/api/layers/layers.constants';
import { buildEntitiesByPointUrl } from '@/data-sources/govmap/api/layers/layers.endpoints';

// ============================================================================
// Schemas
// ============================================================================

const inputSchema = z.object({
    address: z.string().describe('כתובת מלאה בעברית — רחוב + מספר + עיר (לדוגמה: "דיזנגוף 50 תל אביב")'),
    radius: z.number().int().min(10).max(5000).optional().default(200).describe('רדיוס חיפוש במטרים (ברירת מחדל: 200)'),
    ...commonToolInput,
});

export const getParcelInfoOutputSchema = toolOutputSchema({
    address: z.string(),
    parcels: z.array(
        z.object({
            gushNum: z.string().optional(),
            parcel: z.string().optional(),
            gushSuffix: z.string().optional(),
            legalArea: z.string().optional(),
            status: z.string().optional(),
            note: z.string().optional(),
            distance: z.number().optional(),
        }),
    ),
    neighborhoods: z.array(
        z.object({
            name: z.string(),
            settlement: z.string(),
            distance: z.number().optional(),
        }),
    ),
    blocks: z.array(
        z.object({
            gushNum: z.string().optional(),
            status: z.string().optional(),
            distance: z.number().optional(),
        }),
    ),
    totalFound: z.number(),
});

// ============================================================================
// Result Types
// ============================================================================

type ParcelResult = ParcelFields & { distance?: number };
type NeighborhoodResult = NeighborhoodFields & { distance?: number };
type BlockResult = BlockFields & { distance?: number };

// ============================================================================
// Tool Definition
// ============================================================================

export const getParcelInfo = createTool({
    id: 'getParcelInfo',
    description: 'חיפוש מידע קרקעי לפי כתובת — גוש, חלקה, שכונה, שטח רשום',
    inputSchema,
    outputSchema: getParcelInfoOutputSchema,
    execute: async ({ address, radius = 200 }) => {
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
            const layerResults = await queryAndCleanEntities(point, PARCEL_LAYER_IDS, radius);

            // 3. Extract and categorize results
            const parcels: ParcelResult[] = [];
            const neighborhoods: NeighborhoodResult[] = [];
            const blocks: BlockResult[] = [];

            for (const [layerName, entities] of layerResults) {
                const lowerName = layerName.toLowerCase();

                if (lowerName.includes('parcel') || lowerName.includes('חלקות')) {
                    for (const entity of entities) {
                        const parsed = parcelFieldsSchema.safeParse(entity.fields);
                        if (parsed.success) {
                            parcels.push({ ...parsed.data, distance: entity.distance });
                        }
                    }
                } else if (lowerName.includes('neighborhood') || lowerName.includes('שכונ')) {
                    for (const entity of entities) {
                        const parsed = neighborhoodFieldsSchema.safeParse(entity.fields);
                        if (parsed.success) {
                            neighborhoods.push({ ...parsed.data, distance: entity.distance });
                        }
                    }
                } else if (lowerName.includes('gush') || lowerName.includes('גוש') || lowerName.includes('sub_gush')) {
                    for (const entity of entities) {
                        const parsed = blockFieldsSchema.safeParse(entity.fields);
                        if (parsed.success) {
                            blocks.push({ ...parsed.data, distance: entity.distance });
                        }
                    }
                } else {
                    // Default: treat as parcels
                    for (const entity of entities) {
                        const parsed = parcelFieldsSchema.safeParse(entity.fields);
                        if (parsed.success) {
                            parcels.push({ ...parsed.data, distance: entity.distance });
                        }
                    }
                }
            }

            const totalFound = parcels.length + neighborhoods.length + blocks.length;

            const portalUrl = buildGovmapPortalUrl(coords.longitude, coords.latitude, address, PARCEL_LAYER_IDS);

            return {
                success: true as const,
                address: autocomplete.results[0].text,
                parcels: parcels.slice(0, 20),
                neighborhoods: neighborhoods.slice(0, 20),
                blocks: blocks.slice(0, 20),
                totalFound,
                apiUrl,
                portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : 'שגיאה בשליפת מידע קרקעי',
                apiUrl,
            };
        }
    },
});
