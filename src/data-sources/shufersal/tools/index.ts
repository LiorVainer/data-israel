/**
 * Shufersal Tools
 *
 * Re-exports all Shufersal tools and collects source URL resolvers.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Tool exports
export { searchShufersalProducts } from './search-products.tool';
export { generateShufersalSourceUrl } from './generate-source-url.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { searchShufersalProducts } from './search-products.tool';
import { generateShufersalSourceUrl } from './generate-source-url.tool';

/** All Shufersal tools as a single object */
export const ShufersalTools = {
    searchShufersalProducts,
    generateShufersalSourceUrl,
};

/** Union of all Shufersal tool names, derived from the ShufersalTools object */
export type ShufersalToolName = keyof typeof ShufersalTools;

// ============================================================================
// Source URL resolvers (co-located in tool files)
// ============================================================================

import { resolveSourceUrl as searchProductsResolver } from './search-products.tool';

/** Collected source resolvers for Shufersal tools */
export const shufersalSourceResolvers: Partial<Record<ShufersalToolName, ToolSourceResolver>> = {
    searchShufersalProducts: searchProductsResolver,
};
