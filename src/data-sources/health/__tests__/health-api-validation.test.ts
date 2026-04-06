/**
 * Health API Validation Tests
 *
 * Calls each Health tool's execute() with real API parameters and validates
 * the response against the tool's declared Zod outputSchema.
 * Catches schema drift when external APIs change.
 *
 * Two sub-APIs:
 * - Overview-data (datadashboard.health.gov.il): getAvailableSubjects, getHealthMetadata, getHealthData, getHealthLinks
 * - Drugs (israeldrugs.health.gov.il): searchDrugByName, searchDrugBySymptom, getDrugDetails, suggestDrugNames, browseSymptoms, exploreGenericAlternatives, exploreTherapeuticCategories
 */

import { describe, it, expect } from 'vitest';

// Overview-data tools + schemas
import {
    getAvailableSubjects,
    getAvailableSubjectsOutputSchema,
} from '../tools/overview-data/get-available-subjects.tool';
import { getHealthMetadata, getHealthMetadataOutputSchema } from '../tools/overview-data/get-health-metadata.tool';
import { getHealthData, getHealthDataOutputSchema } from '../tools/overview-data/get-health-data.tool';
import { getHealthLinks, getHealthLinksOutputSchema } from '../tools/overview-data/get-health-links.tool';

// Drugs tools + schemas
import { searchDrugByName, searchDrugByNameOutputSchema } from '../tools/drugs/search-drug-by-name.tool';
import { searchDrugBySymptom, searchDrugBySymptomOutputSchema } from '../tools/drugs/search-drug-by-symptom.tool';
import { getDrugDetails, getDrugDetailsOutputSchema } from '../tools/drugs/get-drug-details.tool';
import { suggestDrugNames, suggestDrugNamesOutputSchema } from '../tools/drugs/suggest-drug-names.tool';
import { browseSymptoms, browseSymptomsOutputSchema } from '../tools/drugs/browse-symptoms.tool';
import {
    exploreGenericAlternatives,
    exploreGenericAlternativesOutputSchema,
} from '../tools/drugs/explore-generic-alternatives.tool';
import {
    exploreTherapeuticCategories,
    exploreTherapeuticCategoriesOutputSchema,
} from '../tools/drugs/explore-therapeutic-categories.tool';

// ============================================================================
// Overview-data API validation
// ============================================================================

describe.sequential('Health overview-data API validation', () => {
    it('getAvailableSubjects output matches schema', async () => {
        const result = await getAvailableSubjects.execute!({ searchedResourceName: 'test' }, {} as never);
        const parsed = getAvailableSubjectsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getHealthMetadata output matches schema', async () => {
        const result = await getHealthMetadata.execute!(
            { subject: 'beaches', searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = getHealthMetadataOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getHealthData output matches schema', async () => {
        const result = await getHealthData.execute!(
            { endPointName: 'beaches/anomalyTestRateAuthority', searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = getHealthDataOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getHealthLinks output matches schema', async () => {
        const result = await getHealthLinks.execute!({ subject: 'beaches', searchedResourceName: 'test' }, {} as never);
        const parsed = getHealthLinksOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);
});

// ============================================================================
// Drugs API validation
// ============================================================================

describe.sequential('Health drugs API validation', () => {
    it('searchDrugByName output matches schema', async () => {
        const result = await searchDrugByName.execute!(
            { drugName: 'acamol', searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = searchDrugByNameOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('searchDrugBySymptom output matches schema', async () => {
        const result = await searchDrugBySymptom.execute!(
            {
                symptomCategory: 'כאב',
                symptomId: 1,
                searchedResourceName: 'test',
            },
            {} as never,
        );
        const parsed = searchDrugBySymptomOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getDrugDetails output matches schema', async () => {
        // Use a well-known registration number (Acamol 500mg)
        const result = await getDrugDetails.execute!(
            { registrationNumber: '109560132', searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = getDrugDetailsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('suggestDrugNames output matches schema', async () => {
        const result = await suggestDrugNames.execute!({ query: 'אקמ', searchedResourceName: 'test' }, {} as never);
        const parsed = suggestDrugNamesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('browseSymptoms output matches schema', async () => {
        const result = await browseSymptoms.execute!(
            { includePopular: true, searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = browseSymptomsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('exploreGenericAlternatives output matches schema', async () => {
        const result = await exploreGenericAlternatives.execute!(
            { activeIngredient: 'paracetamol', searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = exploreGenericAlternativesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('exploreTherapeuticCategories (atc) output matches schema', async () => {
        const result = await exploreTherapeuticCategories.execute!(
            { type: 'atc', searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = exploreTherapeuticCategoriesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('exploreTherapeuticCategories (routes) output matches schema', async () => {
        const result = await exploreTherapeuticCategories.execute!(
            { type: 'routes', searchedResourceName: 'test' },
            {} as never,
        );
        const parsed = exploreTherapeuticCategoriesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);
});
