/**
 * CBS API Validation Tests
 *
 * Calls each CBS tool's execute() with real API parameters and validates
 * the response against the tool's declared Zod outputSchema.
 * Catches schema drift when external CBS APIs change.
 *
 * NOTE: These tests hit real external APIs — do NOT mock anything.
 */

import { describe, it, expect } from 'vitest';

import { browseCbsCatalog } from '../tools/series/browse-cbs-catalog.tool';
import { browseCbsCatalogOutputSchema } from '../tools/series/browse-cbs-catalog.tool';

import { browseCbsCatalogPath } from '../tools/series/browse-cbs-catalog-path.tool';
import { browseCbsCatalogPathOutputSchema } from '../tools/series/browse-cbs-catalog-path.tool';

import { getCbsSeriesData } from '../tools/series/get-cbs-series-data.tool';
import { getCbsSeriesDataOutputSchema } from '../tools/series/get-cbs-series-data.tool';

import { getCbsSeriesDataByPath } from '../tools/series/get-cbs-series-data-by-path.tool';
import { getCbsSeriesDataByPathOutputSchema } from '../tools/series/get-cbs-series-data-by-path.tool';

import { browseCbsPriceIndices } from '../tools/price/browse-cbs-price-indices.tool';
import { browseCbsPriceIndicesOutputSchema } from '../tools/price/browse-cbs-price-indices.tool';

import { getCbsPriceData } from '../tools/price/get-cbs-price-data.tool';
import { getCbsPriceDataOutputSchema } from '../tools/price/get-cbs-price-data.tool';

import { calculateCbsPriceIndex } from '../tools/price/calculate-cbs-price-index.tool';
import { calculateCbsPriceIndexOutputSchema } from '../tools/price/calculate-cbs-price-index.tool';

import { searchCbsLocalities } from '../tools/dictionary/search-cbs-localities.tool';
import { searchCbsLocalitiesOutputSchema } from '../tools/dictionary/search-cbs-localities.tool';

// ============================================================================
// Tests
// ============================================================================

describe.sequential('CBS API validation', () => {
    it('browseCbsCatalog output matches schema', async () => {
        const result = await browseCbsCatalog.execute!({ level: 1, searchedResourceName: 'test' }, {} as never);
        const parsed = browseCbsCatalogOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('browseCbsCatalogPath output matches schema', async () => {
        const result = await browseCbsCatalogPath.execute!({ path: '2' }, {} as never);
        const parsed = browseCbsCatalogPathOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getCbsSeriesData output matches schema', async () => {
        const result = await getCbsSeriesData.execute!(
            { seriesId: '1', last: 3, searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = getCbsSeriesDataOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getCbsSeriesDataByPath output matches schema', async () => {
        const result = await getCbsSeriesDataByPath.execute!(
            { path: '2,1', last: 3, searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = getCbsSeriesDataByPathOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('browseCbsPriceIndices (chapters) output matches schema', async () => {
        const result = await browseCbsPriceIndices.execute!(
            { mode: 'chapters', searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = browseCbsPriceIndicesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getCbsPriceData output matches schema', async () => {
        const result = await getCbsPriceData.execute!(
            { indexCode: '110011', last: 3, searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = getCbsPriceDataOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('calculateCbsPriceIndex output matches schema', async () => {
        const result = await calculateCbsPriceIndex.execute!(
            {
                indexCode: '110011',
                startDate: '2020-01-01',
                endDate: '2024-01-01',
                amount: 100000,
                searchedResourceName: 'test',
            },
            {} as never,
        );
        const parsed = calculateCbsPriceIndexOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('searchCbsLocalities output matches schema', async () => {
        const result = await searchCbsLocalities.execute!(
            { query: 'ירושלים', pageSize: 3, searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = searchCbsLocalitiesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);
});
