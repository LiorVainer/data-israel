/**
 * Rami Levy Tools
 *
 * Re-exports all Rami Levy tools and collects source URL configs.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

// Tool exports
export { searchRamiLevyProducts } from './search-products.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { searchRamiLevyProducts } from './search-products.tool';

/** All Rami Levy tools as a single object */
export const RamiLevyTools = {
    searchRamiLevyProducts,
};

/** Union of all Rami Levy tool names, derived from the RamiLevyTools object */
export type RamiLevyToolName = keyof typeof RamiLevyTools;

// ============================================================================
// Source URL configs (declarative — registry auto-generates resolvers)
// ============================================================================

/** Declarative source configs for Rami Levy tools */
export const ramiLevySourceConfigs: Partial<Record<RamiLevyToolName, ToolSourceConfig>> = {
    searchRamiLevyProducts: { title: 'חיפוש מוצרים — רמי לוי' },
};
