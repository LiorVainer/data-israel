import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    commonToolInput,
    externalUrls,
    commonSuccessOutput,
    commonErrorOutput,
    toolOutputSchema,
} from '../tool-schemas';

describe('commonToolInput', () => {
    it('includes searchedResourceName as a required string', () => {
        const schema = z.object(commonToolInput);
        const valid = schema.safeParse({ searchedResourceName: 'מידע ציבורי' });
        expect(valid.success).toBe(true);

        const missing = schema.safeParse({});
        expect(missing.success).toBe(false);
    });
});

describe('externalUrls', () => {
    it('includes optional apiUrl and portalUrl', () => {
        const schema = z.object(externalUrls);

        const empty = schema.safeParse({});
        expect(empty.success).toBe(true);

        const withUrls = schema.safeParse({
            apiUrl: 'https://api.example.com',
            portalUrl: 'https://portal.example.com',
        });
        expect(withUrls.success).toBe(true);
    });
});

describe('commonSuccessOutput', () => {
    it('includes success: true and external URL fields', () => {
        const schema = z.object(commonSuccessOutput);
        const result = schema.safeParse({ success: true });
        expect(result.success).toBe(true);

        const withUrls = schema.safeParse({
            success: true,
            apiUrl: 'https://api.example.com',
            portalUrl: 'https://portal.example.com',
        });
        expect(withUrls.success).toBe(true);
    });

    it('rejects success: false', () => {
        const schema = z.object(commonSuccessOutput);
        const result = schema.safeParse({ success: false });
        expect(result.success).toBe(false);
    });
});

describe('commonErrorOutput', () => {
    it('requires success: false and error string', () => {
        const valid = commonErrorOutput.safeParse({
            success: false,
            error: 'Something went wrong',
        });
        expect(valid.success).toBe(true);
    });

    it('accepts optional apiUrl and portalUrl', () => {
        const valid = commonErrorOutput.safeParse({
            success: false,
            error: 'fail',
            apiUrl: 'https://api.example.com',
            portalUrl: 'https://portal.example.com',
        });
        expect(valid.success).toBe(true);
    });

    it('rejects success: true', () => {
        const result = commonErrorOutput.safeParse({
            success: true,
            error: 'fail',
        });
        expect(result.success).toBe(false);
    });

    it('rejects missing error field', () => {
        const result = commonErrorOutput.safeParse({ success: false });
        expect(result.success).toBe(false);
    });
});

describe('toolOutputSchema', () => {
    const schema = toolOutputSchema({
        items: z.array(z.object({ name: z.string() })),
        totalItems: z.number(),
    });

    it('produces a valid discriminated union on "success"', () => {
        // Verify it behaves as a discriminated union by checking both branches parse
        expect(schema).toBeDefined();

        // success: true branch should work
        const successResult = schema.safeParse({
            success: true,
            items: [],
            totalItems: 0,
        });
        expect(successResult.success).toBe(true);

        // success: false branch should work
        const errorResult = schema.safeParse({
            success: false,
            error: 'test',
        });
        expect(errorResult.success).toBe(true);

        // Neither branch matches an invalid discriminator
        const invalidResult = schema.safeParse({
            success: 'maybe',
        });
        expect(invalidResult.success).toBe(false);
    });

    it('accepts a success branch with custom fields and common fields', () => {
        const result = schema.safeParse({
            success: true,
            items: [{ name: 'Dataset A' }],
            totalItems: 1,
        });
        expect(result.success).toBe(true);
    });

    it('success branch includes optional apiUrl and portalUrl', () => {
        const result = schema.safeParse({
            success: true,
            items: [{ name: 'Dataset A' }],
            totalItems: 1,
            apiUrl: 'https://api.example.com',
            portalUrl: 'https://portal.example.com',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toMatchObject({
                success: true,
                apiUrl: 'https://api.example.com',
                portalUrl: 'https://portal.example.com',
            });
        }
    });

    it('rejects success branch with missing custom fields', () => {
        const result = schema.safeParse({
            success: true,
            // missing items and totalItems
        });
        expect(result.success).toBe(false);
    });

    it('accepts an error branch matching commonErrorOutput', () => {
        const result = schema.safeParse({
            success: false,
            error: 'API unreachable',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toMatchObject({
                success: false,
                error: 'API unreachable',
            });
        }
    });

    it('error branch accepts optional apiUrl and portalUrl', () => {
        const result = schema.safeParse({
            success: false,
            error: 'timeout',
            apiUrl: 'https://api.example.com',
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid discriminator value', () => {
        const result = schema.safeParse({
            success: 'maybe',
            items: [],
            totalItems: 0,
        });
        expect(result.success).toBe(false);
    });
});
