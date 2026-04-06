/**
 * GovMap API Validation Tests
 *
 * Calls each GovMap tool's execute() with real API parameters and validates
 * the response against the tool's declared Zod outputSchema.
 * Catches schema drift when external APIs (govmap.gov.il) change.
 *
 * NOTE: These tests hit real external APIs — do NOT mock anything.
 * Both success AND error responses are valid as long as they match the schema.
 */

import { describe, it, expect } from 'vitest';

import { autocompleteNadlanAddress } from '../tools/nadlan/autocomplete-address.tool';
import { autocompleteAddressOutputSchema } from '../tools/nadlan/autocomplete-address.tool';

import { findRecentNadlanDeals } from '../tools/nadlan/find-recent-deals.tool';
import { findRecentDealsOutputSchema } from '../tools/nadlan/find-recent-deals.tool';

import { getStreetNadlanDeals } from '../tools/nadlan/get-street-deals.tool';
import { getStreetDealsOutputSchema } from '../tools/nadlan/get-street-deals.tool';

import { getNeighborhoodNadlanDeals } from '../tools/nadlan/get-neighborhood-deals.tool';
import { getNeighborhoodDealsOutputSchema } from '../tools/nadlan/get-neighborhood-deals.tool';

import { getNadlanValuationComparables } from '../tools/nadlan/get-valuation-comparables.tool';
import { getValuationComparablesOutputSchema } from '../tools/nadlan/get-valuation-comparables.tool';

import { getNadlanMarketActivity } from '../tools/nadlan/get-market-activity.tool';
import { getMarketActivityOutputSchema } from '../tools/nadlan/get-market-activity.tool';

import { getNadlanDealStatistics } from '../tools/nadlan/get-deal-statistics.tool';
import { getDealStatisticsOutputSchema } from '../tools/nadlan/get-deal-statistics.tool';

// Execution context stub — tools don't use the context parameter
const ctx = {} as Record<string, unknown>;

describe.sequential('GovMap API validation', () => {
    it('autocompleteNadlanAddress output matches schema', async () => {
        const result = await autocompleteNadlanAddress.execute!(
            {
                searchText: 'הרצל 1 תל אביב',
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = autocompleteAddressOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('findRecentNadlanDeals output matches schema', async () => {
        const result = await findRecentNadlanDeals.execute!(
            {
                address: 'הרצל 1 תל אביב',
                yearsBack: 2,
                radiusMeters: 200,
                maxDeals: 3,
                dealType: 2,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = findRecentDealsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getStreetNadlanDeals output matches schema', async () => {
        // Polygon IDs come from findRecentNadlanDeals internally — use a placeholder.
        // Both success and error responses are valid schema conformance.
        const result = await getStreetNadlanDeals.execute!(
            {
                polygonId: '1',
                limit: 3,
                dealType: 2,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = getStreetDealsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getNeighborhoodNadlanDeals output matches schema', async () => {
        // Use a placeholder polygon ID — both success and error responses are valid
        const result = await getNeighborhoodNadlanDeals.execute!(
            {
                polygonId: '1',
                limit: 3,
                dealType: 2,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = getNeighborhoodDealsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getNadlanValuationComparables output matches schema', async () => {
        const result = await getNadlanValuationComparables.execute!(
            {
                address: 'הרצל 10 חולון',
                targetAreaSqm: 80,
                radiusMeters: 100,
                yearsBack: 2,
                dealType: 2,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = getValuationComparablesOutputSchema.safeParse(result);
        if (!parsed.success) {
            console.error('Raw result:', JSON.stringify(result, null, 2));
            console.error(parsed.error.issues);
        }
        expect(parsed.success).toBe(true);
    }, 60_000);

    it('getNadlanMarketActivity output matches schema', async () => {
        const result = await getNadlanMarketActivity.execute!(
            {
                address: 'הרצל 50 חיפה',
                yearsBack: 3,
                radiusMeters: 200,
                dealType: 2,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = getMarketActivityOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getNadlanDealStatistics output matches schema', async () => {
        const result = await getNadlanDealStatistics.execute!(
            {
                address: 'אלנבי 100 תל אביב',
                yearsBack: 2,
                radiusMeters: 200,
                dealType: 2,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = getDealStatisticsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);
});
