/**
 * Nadlan (Real Estate) Tools
 *
 * Re-exports all Nadlan tools and collects source URL resolvers.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Tool exports
export { autocompleteNadlanAddress } from './autocomplete-address.tool';
export { findRecentNadlanDeals } from './find-recent-deals.tool';
export { getStreetNadlanDeals } from './get-street-deals.tool';
export { getNeighborhoodNadlanDeals } from './get-neighborhood-deals.tool';
export { getNadlanValuationComparables } from './get-valuation-comparables.tool';
export { getNadlanMarketActivity } from './get-market-activity.tool';
export { getNadlanDealStatistics } from './get-deal-statistics.tool';
export { generateNadlanSourceUrl } from './generate-source-url.tool';

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
import { generateNadlanSourceUrl } from './generate-source-url.tool';

/** All Nadlan tools as a single object */
export const NadlanTools = {
    autocompleteNadlanAddress,
    findRecentNadlanDeals,
    getStreetNadlanDeals,
    getNeighborhoodNadlanDeals,
    getNadlanValuationComparables,
    getNadlanMarketActivity,
    getNadlanDealStatistics,
    generateNadlanSourceUrl,
};

/** Union of all Nadlan tool names, derived from the NadlanTools object */
export type NadlanToolName = keyof typeof NadlanTools;

// ============================================================================
// Source URL resolvers (co-located in tool files)
// ============================================================================

import { resolveSourceUrl as findRecentDealsResolver } from './find-recent-deals.tool';
import { resolveSourceUrl as getStreetDealsResolver } from './get-street-deals.tool';
import { resolveSourceUrl as getNeighborhoodDealsResolver } from './get-neighborhood-deals.tool';
import { resolveSourceUrl as getValuationComparablesResolver } from './get-valuation-comparables.tool';
import { resolveSourceUrl as getMarketActivityResolver } from './get-market-activity.tool';
import { resolveSourceUrl as getDealStatisticsResolver } from './get-deal-statistics.tool';

/** Collected source resolvers for Nadlan tools */
export const nadlanSourceResolvers: Partial<Record<NadlanToolName, ToolSourceResolver>> = {
    findRecentNadlanDeals: findRecentDealsResolver,
    getStreetNadlanDeals: getStreetDealsResolver,
    getNeighborhoodNadlanDeals: getNeighborhoodDealsResolver,
    getNadlanValuationComparables: getValuationComparablesResolver,
    getNadlanMarketActivity: getMarketActivityResolver,
    getNadlanDealStatistics: getDealStatisticsResolver,
};
