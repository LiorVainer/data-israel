/**
 * CBS (Central Bureau of Statistics) Tools
 *
 * Re-exports all CBS tools from sub-categories
 */

export { browseCbsCatalog } from './series/browse-cbs-catalog';
export { browseCbsCatalogPath } from './series/browse-cbs-catalog-path';
export { getCbsSeriesData } from './series/get-cbs-series-data';
export { getCbsSeriesDataByPath } from './series/get-cbs-series-data-by-path';
export { browseCbsPriceIndices } from './price/browse-cbs-price-indices';
export { getCbsPriceData } from './price/get-cbs-price-data';
export { calculateCbsPriceIndex } from './price/calculate-cbs-price-index';
export { searchCbsLocalities } from './dictionary/search-cbs-localities';

import { browseCbsCatalog } from './series/browse-cbs-catalog';
import { browseCbsCatalogPath } from './series/browse-cbs-catalog-path';
import { getCbsSeriesData } from './series/get-cbs-series-data';
import { getCbsSeriesDataByPath } from './series/get-cbs-series-data-by-path';
import { browseCbsPriceIndices } from './price/browse-cbs-price-indices';
import { getCbsPriceData } from './price/get-cbs-price-data';
import { calculateCbsPriceIndex } from './price/calculate-cbs-price-index';
import { searchCbsLocalities } from './dictionary/search-cbs-localities';

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
