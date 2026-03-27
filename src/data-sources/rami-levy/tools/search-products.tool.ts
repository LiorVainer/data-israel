/**
 * Search Products Tool
 *
 * Search the Rami Levy product catalog by name or barcode.
 * Calls the POST https://www.rami-levy.co.il/api/catalog endpoint.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ramiLevyApi } from '../api/rami-levy.client';
import { RAMI_LEVY_DEFAULT_STORE_ID, buildSearchPortalUrl } from '../api/rami-levy.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Helpers
// ============================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
}

// ============================================================================
// Schemas
// ============================================================================

const productSchema = z.object({
    name: z.string().describe('Product name in Hebrew'),
    price: z.number().describe('Price in NIS'),
    barcode: z.string().describe('Barcode (EAN)'),
    brand: z.string().describe('Brand name'),
    department: z.string().describe('Top-level category'),
    isWeighted: z.boolean().describe('Whether the product is sold by weight'),
});

export const searchRamiLevyProductsInputSchema = z.object({
    query: z.string().describe('Search term — product name or barcode'),
    storeId: z.string().default(RAMI_LEVY_DEFAULT_STORE_ID).describe('Store branch ID (default: 331)'),
    limit: z.number().min(1).max(50).default(10).describe('Max results to return (default: 10)'),
    ...commonToolInput,
});

const successFields = {
    products: z.array(productSchema).describe('Matching products'),
    totalResults: z.number().describe('Total matching products in catalog'),
    query: z.string().describe('The search query used'),
    storeId: z.string().describe('Store branch ID queried'),
};

export const searchRamiLevyProductsOutputSchema = toolOutputSchema(successFields);

// ============================================================================
// Tool Definition
// ============================================================================

export const searchRamiLevyProducts = createTool({
    id: 'searchRamiLevyProducts',
    description:
        'חיפוש מוצרים בקטלוג רמי לוי לפי שם מוצר או ברקוד. מחזיר שם, מחיר, ברקוד, מותג, מחלקה והאם נמכר במשקל.',
    inputSchema: searchRamiLevyProductsInputSchema,
    outputSchema: searchRamiLevyProductsOutputSchema,
    execute: async ({ query, storeId, limit }) => {
        try {
            const { products, total } = await ramiLevyApi.searchProducts(query, storeId, limit);

            const mapped = products.map((p) => ({
                name: p.name,
                price: p.price.price,
                barcode: p.barcode,
                brand: p.gs?.BrandName ?? '',
                department: p.department?.name ?? '',
                isWeighted: p.prop?.sw_shakil === 1 || p.prop?.by_kilo === 1,
            }));

            return {
                success: true as const,
                products: mapped,
                totalResults: total,
                query,
                storeId: storeId ?? '331',
                portalUrl: buildSearchPortalUrl(query),
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : 'Unknown error searching Rami Levy catalog',
            };
        }
    },
});

// ============================================================================
// Source URL Resolver
// ============================================================================

export const resolveSourceUrl: ToolSourceResolver = (input, output) => {
    if (!isRecord(output) || output.success === false) return null;

    const portalUrl = getString(output, 'portalUrl');
    if (portalUrl) {
        const searchedName = getString(input, 'searchedResourceName');
        return {
            url: portalUrl,
            title: searchedName ?? 'חיפוש מוצרים ברמי לוי',
            urlType: 'portal',
        };
    }

    return null;
};
