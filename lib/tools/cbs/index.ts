/**
 * CBS (Central Bureau of Statistics) Tools
 *
 * Re-exports all CBS tools from sub-categories
 */

export { browseCbsCatalog } from './series/browse-cbs-catalog';
export { getCbsSeriesData } from './series/get-cbs-series-data';
export { browseCbsPriceIndices } from './price/browse-cbs-price-indices';
export { getCbsPriceData } from './price/get-cbs-price-data';
export { calculateCbsPriceIndex } from './price/calculate-cbs-price-index';
export { searchCbsLocalities } from './dictionary/search-cbs-localities';

import { browseCbsCatalog } from './series/browse-cbs-catalog';
import { getCbsSeriesData } from './series/get-cbs-series-data';
import { browseCbsPriceIndices } from './price/browse-cbs-price-indices';
import { getCbsPriceData } from './price/get-cbs-price-data';
import { calculateCbsPriceIndex } from './price/calculate-cbs-price-index';
import { searchCbsLocalities } from './dictionary/search-cbs-localities';

export const CbsTools = {
    browseCbsCatalog,
    getCbsSeriesData,
    browseCbsPriceIndices,
    getCbsPriceData,
    calculateCbsPriceIndex,
    searchCbsLocalities,
};
