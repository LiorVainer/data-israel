/**
 * Search Product Price Tool
 *
 * Searches for a product by barcode or name in a specific chain's price feed.
 * Israeli barcodes start with 729. Prices include 18% VAT.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import { searchProducts } from '../api/grocery.client';
import { ALL_CHAIN_IDS, getChainName, buildChainPortalUrl } from '../api/grocery.endpoints';
import type { ChainId } from '../api/grocery.endpoints';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

const chainIdSchema = z
    .enum(ALL_CHAIN_IDS as [string, ...string[]])
    .describe('Supermarket chain ID. Options: shufersal, rami-levy, yochananof, victory, osher-ad, tiv-taam');

export const searchProductPriceInputSchema = z.object({
    chainId: chainIdSchema,
    query: z.string().describe('Product barcode (e.g., 7290000066318) or Hebrew product name to search for'),
    limit: z.number().int().min(1).max(50).optional().describe('Maximum number of results (default 20)'),
    ...commonToolInput,
});

const groceryItemSchema = z.object({
    barcode: z.string(),
    itemCode: z.string(),
    name: z.string(),
    manufacturer: z.string(),
    unitQty: z.string(),
    unitOfMeasure: z.string(),
    price: z.number().describe('Price in ILS (includes 18% VAT)'),
    unitPrice: z.number().describe('Price per unit of measure in ILS'),
    allowDiscount: z.boolean(),
    priceUpdateDate: z.string(),
});

export const searchProductPriceOutputSchema = toolOutputSchema({
    chainId: z.string(),
    chainName: z.string(),
    items: z.array(groceryItemSchema),
    totalFound: z.number(),
    query: z.string(),
});

export type SearchProductPriceInput = z.infer<typeof searchProductPriceInputSchema>;
export type SearchProductPriceOutput = z.infer<typeof searchProductPriceOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const searchProductPrice = createTool({
    id: 'searchProductPrice',
    description:
        'Search for a grocery product by barcode or Hebrew name in a specific supermarket chain. Returns product details including price (ILS, includes 18% VAT). Israeli barcodes typically start with 729.',
    inputSchema: searchProductPriceInputSchema,
    outputSchema: searchProductPriceOutputSchema,
    execute: async ({ chainId, query, limit }) => {
        const typedChainId = chainId as ChainId;
        const portalUrl = buildChainPortalUrl(typedChainId);

        try {
            const items = await searchProducts(typedChainId, query, limit ?? 20);

            return {
                success: true as const,
                chainId,
                chainName: getChainName(typedChainId),
                items,
                totalFound: items.length,
                query,
                portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                portalUrl,
            };
        }
    },
});

// ============================================================================
// Source URL Resolver
// ============================================================================

function getString(obj: unknown, key: string): string | undefined {
    if (typeof obj === 'object' && obj !== null && key in obj) {
        const val = (obj as Record<string, unknown>)[key];
        return typeof val === 'string' ? val : undefined;
    }
    return undefined;
}

export const resolveSourceUrl: ToolSourceResolver = (_input, output) => {
    const portalUrl = getString(output, 'portalUrl');
    if (!portalUrl) return null;

    const chainName = getString(output, 'chainName') ?? 'מחירי סופרמרקט';
    return {
        url: portalUrl,
        title: `מחירון ${chainName}`,
        urlType: 'portal',
    };
};
