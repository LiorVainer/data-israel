/**
 * Grocery (Supermarket Prices) Tools
 *
 * Re-exports all grocery tools and collects source URL resolvers.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Tool exports
export { searchProductPrice } from './search-product-price.tool';
export { compareAcrossChains } from './compare-across-chains.tool';
export { getChainStores } from './get-chain-stores.tool';
export { getActivePromotions } from './get-active-promotions.tool';
export { generateGrocerySourceUrl } from './generate-source-url.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { searchProductPrice } from './search-product-price.tool';
import { compareAcrossChains } from './compare-across-chains.tool';
import { getChainStores } from './get-chain-stores.tool';
import { getActivePromotions } from './get-active-promotions.tool';
import { generateGrocerySourceUrl } from './generate-source-url.tool';

/** All grocery tools as a single object */
export const GroceryTools = {
    searchProductPrice,
    compareAcrossChains,
    getChainStores,
    getActivePromotions,
    generateGrocerySourceUrl,
};

/** Union of all grocery tool names, derived from the GroceryTools object */
export type GroceryToolName = keyof typeof GroceryTools;

// ============================================================================
// Source URL resolvers (co-located in tool files)
// ============================================================================

import { resolveSourceUrl as searchProductPriceResolver } from './search-product-price.tool';
import { resolveSourceUrl as compareAcrossChainsResolver } from './compare-across-chains.tool';

/** Collected source resolvers for grocery tools */
export const grocerySourceResolvers: Partial<Record<GroceryToolName, ToolSourceResolver>> = {
    searchProductPrice: searchProductPriceResolver,
    compareAcrossChains: compareAcrossChainsResolver,
};
