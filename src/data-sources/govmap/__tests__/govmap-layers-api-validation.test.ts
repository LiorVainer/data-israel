/**
 * GovMap Layers API Validation Tests
 *
 * Calls each layers tool's execute() with real API parameters and validates
 * the response against the tool's declared Zod outputSchema.
 * Catches schema drift when govmap.gov.il layers-catalog API changes.
 *
 * NOTE: These tests hit real external APIs — do NOT mock anything.
 * Both success AND error responses are valid as long as they match the schema.
 */

import { describe, it, expect } from 'vitest';

import { findNearbyServices, findNearbyServicesOutputSchema } from '../tools/layers/find-nearby-services.tool';
import { getParcelInfo, getParcelInfoOutputSchema } from '../tools/layers/get-parcel-info.tool';
import { findNearbyTourism, findNearbyTourismOutputSchema } from '../tools/layers/find-nearby-tourism.tool';
import { getLocationContext, getLocationContextOutputSchema } from '../tools/layers/get-location-context.tool';

const ctx = {} as Record<string, unknown>;

describe.sequential('GovMap Layers API validation', () => {
    it('findNearbyServices output matches schema', async () => {
        const result = await findNearbyServices.execute!(
            {
                address: 'הרצל 1 תל אביב',
                radius: 2000,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = findNearbyServicesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getParcelInfo output matches schema', async () => {
        const result = await getParcelInfo.execute!(
            {
                address: 'סוקולוב 38 חולון',
                radius: 200,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = getParcelInfoOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('findNearbyTourism output matches schema', async () => {
        const result = await findNearbyTourism.execute!(
            {
                address: 'הירקון 100 תל אביב',
                radius: 5000,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = findNearbyTourismOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getLocationContext output matches schema', async () => {
        const result = await getLocationContext.execute!(
            {
                address: 'דיזנגוף 50 תל אביב',
                radius: 500,
                searchedResourceName: 'test',
            },
            ctx,
        );

        const parsed = getLocationContextOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);
});
