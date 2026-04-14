/**
 * Search Products Tool
 *
 * Search Shufersal products by name, barcode, or keyword.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { shufersalApi } from '../api/shufersal.client';
import { buildShufersalSearchUrl } from '../api/shufersal.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

const productSummarySchema = z.object({
    code: z.string(),
    name: z.string(),
    price: z.number(),
    formattedPrice: z.string(),
    manufacturer: z.string().nullable(),
    brandName: z.string().nullable(),
    unitDescription: z.string().nullable(),
    category: z.string().nullable(),
    sellingMethod: z.string().nullable(),
    imageUrl: z.string().nullable(),
});

export const searchProductsInputSchema = z.object({
    query: z.string().min(1).describe('מילת מפתח, שם מוצר או ברקוד לחיפוש בשופרסל'),
    limit: z.number().int().min(1).max(30).optional().describe('מספר תוצאות מקסימלי (ברירת מחדל: 10)'),
    ...commonToolInput,
});

export const searchProductsOutputSchema = toolOutputSchema({
    query: z.string(),
    products: z.array(productSummarySchema),
    totalFound: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const searchShufersalProducts = createTool({
    id: 'searchShufersalProducts',
    description:
        'חיפוש מוצרים בשופרסל אונליין לפי שם, ברקוד או מילת מפתח. מחזיר רשימת מוצרים עם שם, מחיר, יצרן, מותג, יחידת מידה וקטגוריה.',
    inputSchema: searchProductsInputSchema,
    outputSchema: searchProductsOutputSchema,
    execute: async ({ query, limit = 10 }) => {
        const apiUrl = buildShufersalSearchUrl(query, limit);

        try {
            const result = await shufersalApi.searchProducts(query, limit);

            if (result.products.length === 0) {
                return {
                    success: false as const,
                    error: `לא נמצאו מוצרים עבור "${query}" בשופרסל`,
                    apiUrl,
                };
            }

            return {
                success: true as const,
                query,
                products: result.products.map((p) => ({
                    code: p.code,
                    name: p.name,
                    price: p.price.value,
                    formattedPrice: p.price.formattedValue,
                    manufacturer: p.manufacturer,
                    brandName: p.brandName,
                    unitDescription: p.unitDescription,
                    category: p.secondLevelCategory,
                    sellingMethod: p.sellingMethod.code,
                    imageUrl: p.images[0]?.url ?? null,
                })),
                totalFound: result.totalFound,
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
