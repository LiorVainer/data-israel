/**
 * CBS (Central Bureau of Statistics) Tools
 *
 * Re-exports all CBS tools and collects source URL resolvers.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Series tools
export { browseCbsCatalog } from './series/browse-cbs-catalog.tool';
export { browseCbsCatalogPath } from './series/browse-cbs-catalog-path.tool';
export { getCbsSeriesData } from './series/get-cbs-series-data.tool';
export { getCbsSeriesDataByPath } from './series/get-cbs-series-data-by-path.tool';

// Price tools
export { browseCbsPriceIndices } from './price/browse-cbs-price-indices.tool';
export { getCbsPriceData } from './price/get-cbs-price-data.tool';
export { calculateCbsPriceIndex } from './price/calculate-cbs-price-index.tool';

// Dictionary tools
export { searchCbsLocalities } from './dictionary/search-cbs-localities.tool';

// Source URL tools
export { generateCbsSourceUrl } from './source/generate-source-url.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { browseCbsCatalog } from './series/browse-cbs-catalog.tool';
import { browseCbsCatalogPath } from './series/browse-cbs-catalog-path.tool';
import { getCbsSeriesData } from './series/get-cbs-series-data.tool';
import { getCbsSeriesDataByPath } from './series/get-cbs-series-data-by-path.tool';
import { browseCbsPriceIndices } from './price/browse-cbs-price-indices.tool';
import { getCbsPriceData } from './price/get-cbs-price-data.tool';
import { calculateCbsPriceIndex } from './price/calculate-cbs-price-index.tool';
import { searchCbsLocalities } from './dictionary/search-cbs-localities.tool';
import { generateCbsSourceUrl } from './source/generate-source-url.tool';

/** All CBS tools as a single object */
export const CbsTools = {
    browseCbsCatalog,
    browseCbsCatalogPath,
    getCbsSeriesData,
    getCbsSeriesDataByPath,
    browseCbsPriceIndices,
    getCbsPriceData,
    calculateCbsPriceIndex,
    searchCbsLocalities,
    generateCbsSourceUrl,
};

/** Union of all CBS tool names, derived from the CbsTools object */
export type CbsToolName = keyof typeof CbsTools;

// ============================================================================
// Source URL resolvers (co-located in tool files)
// ============================================================================

import { resolveSourceUrl as getCbsSeriesDataResolver } from './series/get-cbs-series-data.tool';
import { resolveSourceUrl as getCbsSeriesDataByPathResolver } from './series/get-cbs-series-data-by-path.tool';
import { resolveSourceUrl as getCbsPriceDataResolver } from './price/get-cbs-price-data.tool';
import { resolveSourceUrl as calculateCbsPriceIndexResolver } from './price/calculate-cbs-price-index.tool';

/** Collected source resolvers for CBS tools */
export const cbsSourceResolvers: Partial<Record<CbsToolName, ToolSourceResolver>> = {
    getCbsSeriesData: getCbsSeriesDataResolver,
    getCbsSeriesDataByPath: getCbsSeriesDataByPathResolver,
    getCbsPriceData: getCbsPriceDataResolver,
    calculateCbsPriceIndex: calculateCbsPriceIndexResolver,
};
