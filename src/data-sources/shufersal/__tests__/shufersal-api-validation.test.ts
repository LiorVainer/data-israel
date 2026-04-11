/**
 * Shufersal API Validation Tests
 *
 * Calls real Shufersal APIs and validates responses against declared Zod output schemas.
 * Catches schema drift when the external API changes.
 */

import { describe, it, expect } from 'vitest';
import { searchShufersalProducts } from '../tools/search-products.tool';
import { searchProductsOutputSchema } from '../tools/search-products.tool';

describe.sequential('Shufersal API validation', () => {
    it('searchShufersalProducts output matches schema', async () => {
        const result = await searchShufersalProducts.execute!(
            {
                query: '\u05D7\u05DC\u05D1',
                limit: 3,
                searchedResourceName: 'test',
            },
            {} as unknown as Record<string, unknown>,
        );

        const parsed = searchProductsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);
});
