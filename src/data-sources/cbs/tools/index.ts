/**
 * CBS (Central Bureau of Statistics) Tools
 *
 * Re-exports all CBS tools and collects source URL resolvers.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

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
};

/** Union of all CBS tool names, derived from the CbsTools object */
export type CbsToolName = keyof typeof CbsTools;

// ============================================================================
// Declarative source URL configs (registry auto-generates resolvers)
// ============================================================================

/** Declarative source configs for CBS tools — registry builds resolvers from these */
export const cbsSourceConfigs: Partial<Record<CbsToolName, ToolSourceConfig>> = {
    getCbsSeriesData: { title: 'סדרה סטטיסטית - הלמ"ס' },
    getCbsSeriesDataByPath: { title: 'סדרה סטטיסטית - הלמ"ס' },
    getCbsPriceData: { title: 'נתוני מחירים - הלמ"ס' },
    calculateCbsPriceIndex: { title: 'מחשבון הצמדה - הלמ"ס' },
};

// ============================================================================
// Resource extractors for ChainOfThought UI chips
// ============================================================================

import type { ToolResourceExtractor } from '@/data-sources/types';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' && val.length > 0 ? val : undefined;
}

/** Extractor for catalog browsing — uses `path` from input */
const catalogPathExtractor: ToolResourceExtractor = (input) => {
    const name = getString(input, 'path');
    return name ? { name } : null;
};

/** Extractor for tools with `searchedResourceName` input */
const resourceNameExtractor: ToolResourceExtractor = (input, output) => {
    const name = getString(input, 'searchedResourceName');
    const url = getString(output, 'apiUrl');
    if (!name && !url) return null;
    return { name, url: url ?? undefined };
};

/** Extractor for search tools that use `query` or `q` input fields */
const searchExtractor: ToolResourceExtractor = (input) => {
    const name = getString(input, 'query') ?? getString(input, 'q');
    return name ? { name } : null;
};

/** Resource extractors for CBS tools */
export const cbsResourceExtractors: Partial<Record<CbsToolName, ToolResourceExtractor>> = {
    browseCbsCatalog: searchExtractor,
    browseCbsCatalogPath: catalogPathExtractor,
    getCbsSeriesData: resourceNameExtractor,
    getCbsSeriesDataByPath: catalogPathExtractor,
    browseCbsPriceIndices: searchExtractor,
    getCbsPriceData: resourceNameExtractor,
    calculateCbsPriceIndex: resourceNameExtractor,
    searchCbsLocalities: searchExtractor,
};
