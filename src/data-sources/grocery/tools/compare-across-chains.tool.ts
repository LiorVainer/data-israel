/**
 * Compare Across Chains Tool
 *
 * Compares prices for a product (by barcode) across multiple supermarket chains.
 * Prices include 18% VAT per Israeli Price Transparency Law 2015.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import { searchProducts } from '../api/grocery.client';
import { ALL_CHAIN_IDS, getChainName, buildChainPortalUrl } from '../api/grocery.endpoints';
import type { ChainId } from '../api/grocery.endpoints';
import type { PriceComparison } from '../api/grocery.types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const compareAcrossChainsInputSchema = z.object({
    barcode: z.string().describe('Product barcode (EAN-13, e.g., 7290000066318) to compare across chains'),
    chainIds: z
        .array(z.enum(ALL_CHAIN_IDS as [string, ...string[]]))
        .optional()
        .describe('Specific chains to compare. If not provided, searches all chains.'),
    ...commonToolInput,
});

const priceEntrySchema = z.object({
    chainId: z.string(),
    chainName: z.string(),
    price: z.number().describe('Price in ILS (includes 18% VAT)'),
    unitPrice: z.number(),
    priceUpdateDate: z.string(),
});

const comparisonSchema = z.object({
    barcode: z.string(),
    name: z.string(),
    manufacturer: z.string(),
    prices: z.array(priceEntrySchema),
    cheapestPrice: z.number(),
    cheapestChain: z.string(),
    mostExpensivePrice: z.number(),
    priceDiffPercent: z.number().describe('Price difference percentage between cheapest and most expensive'),
});

export const compareAcrossChainsOutputSchema = toolOutputSchema({
    comparison: comparisonSchema,
    chainsSearched: z.number(),
    chainsWithProduct: z.number(),
});

export type CompareAcrossChainsInput = z.infer<typeof compareAcrossChainsInputSchema>;
export type CompareAcrossChainsOutput = z.infer<typeof compareAcrossChainsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const compareAcrossChains = createTool({
    id: 'compareAcrossChains',
    description:
        'Compare the price of a specific product (by barcode) across multiple Israeli supermarket chains. Returns a comparison table with prices, cheapest/most expensive chain, and price difference percentage. Prices include 18% VAT.',
    inputSchema: compareAcrossChainsInputSchema,
    outputSchema: compareAcrossChainsOutputSchema,
    execute: async ({ barcode, chainIds }) => {
        const chainsToSearch: ChainId[] = (chainIds as ChainId[] | undefined) ?? [...ALL_CHAIN_IDS];

        try {
            const results = await Promise.allSettled(
                chainsToSearch.map(async (chainId) => {
                    const items = await searchProducts(chainId, barcode, 1);
                    return { chainId, items };
                }),
            );

            const prices: PriceComparison['prices'] = [];
            let productName = '';
            let manufacturer = '';

            for (const result of results) {
                if (result.status !== 'fulfilled') continue;
                const { chainId, items } = result.value;
                if (items.length === 0) continue;

                const item = items[0];
                if (!productName) productName = item.name;
                if (!manufacturer) manufacturer = item.manufacturer;

                prices.push({
                    chainId,
                    chainName: getChainName(chainId),
                    price: item.price,
                    unitPrice: item.unitPrice,
                    priceUpdateDate: item.priceUpdateDate,
                });
            }

            if (prices.length === 0) {
                return {
                    success: false as const,
                    error: `לא נמצא מוצר עם ברקוד ${barcode} באף רשת`,
                };
            }

            // Sort by price ascending
            prices.sort((a, b) => a.price - b.price);

            const cheapest = prices[0];
            const mostExpensive = prices[prices.length - 1];
            const priceDiffPercent =
                cheapest.price > 0 ? Math.round(((mostExpensive.price - cheapest.price) / cheapest.price) * 100) : 0;

            const comparison: PriceComparison = {
                barcode,
                name: productName,
                manufacturer,
                prices,
                cheapestPrice: cheapest.price,
                cheapestChain: cheapest.chainId as ChainId,
                mostExpensivePrice: mostExpensive.price,
                priceDiffPercent,
            };

            return {
                success: true as const,
                comparison,
                chainsSearched: chainsToSearch.length,
                chainsWithProduct: prices.length,
                portalUrl: buildChainPortalUrl(cheapest.chainId as ChainId),
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
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

    return {
        url: portalUrl,
        title: 'השוואת מחירים בסופרמרקטים',
        urlType: 'portal',
    };
};
