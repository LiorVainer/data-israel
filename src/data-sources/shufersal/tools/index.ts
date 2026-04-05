/**
 * Shufersal Tools
 *
 * Re-exports all Shufersal tools and collects source URL configs.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

// Tool exports
export { searchShufersalProducts } from './search-products.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { searchShufersalProducts } from './search-products.tool';

/** All Shufersal tools as a single object */
export const ShufersalTools = {
    searchShufersalProducts,
};

/** Union of all Shufersal tool names, derived from the ShufersalTools object */
export type ShufersalToolName = keyof typeof ShufersalTools;

// ============================================================================
// Source URL configs (declarative — registry auto-generates resolvers)
// ============================================================================

/** Declarative source configs for Shufersal tools */
export const shufersalSourceConfigs: Partial<Record<ShufersalToolName, ToolSourceConfig>> = {
    searchShufersalProducts: { title: 'חיפוש מוצרים — שופרסל' },
};
