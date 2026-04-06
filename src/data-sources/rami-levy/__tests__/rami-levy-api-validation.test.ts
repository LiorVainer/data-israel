/**
 * Rami Levy API Validation Tests
 *
 * Calls real Rami Levy API endpoints and validates responses against
 * declared Zod output schemas. Catches schema drift when the external API changes.
 *
 * These tests are NOT mocked — they hit the live Rami Levy catalog API.
 */

import { describe, it, expect } from 'vitest';
import { searchRamiLevyProducts } from '../tools/search-products.tool';
import { searchRamiLevyProductsOutputSchema } from '../tools/search-products.tool';

describe.sequential('Rami Levy API validation', () => {
    it('searchRamiLevyProducts output matches schema', async () => {
        const result = await searchRamiLevyProducts.execute!(
            { query: 'חלב', limit: 3, searchedResourceName: 'test' },
            {} as unknown as typeof searchRamiLevyProducts extends {
                execute: (input: infer _I, ctx: infer C) => unknown;
            }
                ? C
                : never,
        );

        const parsed = searchRamiLevyProductsOutputSchema.safeParse(result);
        if (!parsed.success) {
            console.error('Schema validation issues:', parsed.error.issues);
        }
        expect(parsed.success).toBe(true);
    }, 30_000);
});
