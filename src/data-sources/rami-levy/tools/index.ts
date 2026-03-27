/**
 * Rami Levy Tools
 *
 * Re-exports all Rami Levy tools and collects source URL resolvers.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Tool exports
export { searchRamiLevyProducts } from './search-products.tool';
export { generateRamiLevySourceUrl } from './generate-source-url.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { searchRamiLevyProducts } from './search-products.tool';
import { generateRamiLevySourceUrl } from './generate-source-url.tool';

/** All Rami Levy tools as a single object */
export const RamiLevyTools = {
    searchRamiLevyProducts,
    generateRamiLevySourceUrl,
};

/** Union of all Rami Levy tool names, derived from the RamiLevyTools object */
export type RamiLevyToolName = keyof typeof RamiLevyTools;

// ============================================================================
// Source URL resolvers (co-located in tool files)
// ============================================================================

import { resolveSourceUrl as searchProductsResolver } from './search-products.tool';

/** Collected source resolvers for Rami Levy tools */
export const ramiLevySourceResolvers: Partial<Record<RamiLevyToolName, ToolSourceResolver>> = {
    searchRamiLevyProducts: searchProductsResolver,
};
