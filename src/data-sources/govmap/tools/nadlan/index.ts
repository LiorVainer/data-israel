/**
 * Nadlan (Real Estate) Tools
 *
 * Re-exports all Nadlan tools and collects declarative source URL configs.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

// Tool exports
export { autocompleteNadlanAddress } from './autocomplete-address.tool';
export { findRecentNadlanDeals } from './find-recent-deals.tool';
export { getStreetNadlanDeals } from './get-street-deals.tool';
export { getNeighborhoodNadlanDeals } from './get-neighborhood-deals.tool';
export { getNadlanValuationComparables } from './get-valuation-comparables.tool';
export { getNadlanMarketActivity } from './get-market-activity.tool';
export { getNadlanDealStatistics } from './get-deal-statistics.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { autocompleteNadlanAddress } from './autocomplete-address.tool';
import { findRecentNadlanDeals } from './find-recent-deals.tool';
import { getStreetNadlanDeals } from './get-street-deals.tool';
import { getNeighborhoodNadlanDeals } from './get-neighborhood-deals.tool';
import { getNadlanValuationComparables } from './get-valuation-comparables.tool';
import { getNadlanMarketActivity } from './get-market-activity.tool';
import { getNadlanDealStatistics } from './get-deal-statistics.tool';

/** All Nadlan tools as a single object */
export const NadlanTools = {
    autocompleteNadlanAddress,
    findRecentNadlanDeals,
    getStreetNadlanDeals,
    getNeighborhoodNadlanDeals,
    getNadlanValuationComparables,
    getNadlanMarketActivity,
    getNadlanDealStatistics,
};

/** Union of all Nadlan tool names, derived from the NadlanTools object */
export type NadlanToolName = keyof typeof NadlanTools;

// ============================================================================
// Declarative source URL configs
// ============================================================================

/** Declarative source configs for Nadlan tools — registry auto-generates resolvers */
export const nadlanSourceConfigs: Partial<Record<NadlanToolName, ToolSourceConfig>> = {
    findRecentNadlanDeals: { title: 'עסקאות נדל"ן' },
    getStreetNadlanDeals: { title: 'עסקאות רחוב' },
    getNeighborhoodNadlanDeals: { title: 'עסקאות שכונה' },
    getNadlanValuationComparables: { title: 'הערכת שווי' },
    getNadlanMarketActivity: { title: 'ניתוח שוק נדל"ן' },
    getNadlanDealStatistics: { title: 'סטטיסטיקת נדל"ן' },
};
