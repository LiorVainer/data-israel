/**
 * DataGov API Validation Tests
 *
 * Calls each DataGov tool's execute() with real API parameters and validates
 * the response against the tool's declared Zod outputSchema.
 * Catches schema drift when the external data.gov.il CKAN API changes.
 *
 * NOTE: These tests hit real external APIs — do NOT mock anything.
 */

import { describe, it, expect } from 'vitest';

import { searchDatasets } from '../tools/search-datasets.tool';
import { searchDatasetsOutputSchema } from '../tools/search-datasets.tool';

import { listAllDatasets } from '../tools/list-all-datasets.tool';
import { listAllDatasetsOutputSchema } from '../tools/list-all-datasets.tool';

import { getDatasetDetails } from '../tools/get-dataset-details.tool';
import { getDatasetDetailsOutputSchema } from '../tools/get-dataset-details.tool';

import { getDatasetActivity } from '../tools/get-dataset-activity.tool';
import { getDatasetActivityOutputSchema } from '../tools/get-dataset-activity.tool';

import { getDatasetSchema } from '../tools/get-dataset-schema.tool';
import { getDatasetSchemaOutputSchema } from '../tools/get-dataset-schema.tool';

import { listOrganizations } from '../tools/list-organizations.tool';
import { listOrganizationsOutputSchema } from '../tools/list-organizations.tool';

import { getOrganizationDetails } from '../tools/get-organization-details.tool';
import { getOrganizationDetailsOutputSchema } from '../tools/get-organization-details.tool';

import { getOrganizationActivity } from '../tools/get-organization-activity.tool';
import { getOrganizationActivityOutputSchema } from '../tools/get-organization-activity.tool';

import { listGroups } from '../tools/list-groups.tool';
import { listGroupsOutputSchema } from '../tools/list-groups.tool';

import { listTags } from '../tools/list-tags.tool';
import { listTagsOutputSchema } from '../tools/list-tags.tool';

import { searchResources } from '../tools/search-resources.tool';
import { searchResourcesOutputSchema } from '../tools/search-resources.tool';

import { getResourceDetails } from '../tools/get-resource-details.tool';
import { getResourceDetailsOutputSchema } from '../tools/get-resource-details.tool';

import { queryDatastoreResource } from '../tools/query-datastore-resource.tool';
import { queryDatastoreResourceOutputSchema } from '../tools/query-datastore-resource.tool';

import { getStatus } from '../tools/get-status.tool';
import { getStatusOutputSchema } from '../tools/get-status.tool';

import { listLicenses } from '../tools/list-licenses.tool';
import { listLicensesOutputSchema } from '../tools/list-licenses.tool';

// Well-known stable IDs from data.gov.il
const KNOWN_DATASET_ID = 'consumer-complaints'; // Consumer complaints dataset
const KNOWN_ORGANIZATION_ID = 'ministry-of-transport'; // Ministry of Transport
// Well-known DataStore resource (רשומות - government gazette)
const KNOWN_DATASTORE_RESOURCE_ID = '2c33a151-f53a-4ec1-9e47-8482e2390577';

// Minimal execution context stub (tools only use input params, not context)
const ctx = {} as Parameters<NonNullable<typeof searchDatasets.execute>>[1];

describe.sequential('DataGov API validation', () => {
    it('searchDatasets output matches schema', async () => {
        const result = await searchDatasets.execute!({ query: 'תחבורה', limit: 3, searchedResourceName: 'test' }, ctx);
        const parsed = searchDatasetsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('listAllDatasets output matches schema', async () => {
        const result = await listAllDatasets.execute!({ searchedResourceName: 'test' }, ctx);
        const parsed = listAllDatasetsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getDatasetDetails output matches schema', async () => {
        const result = await getDatasetDetails.execute!({ id: KNOWN_DATASET_ID, searchedResourceName: 'test' }, ctx);
        const parsed = getDatasetDetailsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getDatasetActivity output matches schema', async () => {
        const result = await getDatasetActivity.execute!(
            { id: KNOWN_DATASET_ID, limit: 3, searchedResourceName: 'test' },
            ctx,
        );
        const parsed = getDatasetActivityOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getDatasetSchema output matches schema', async () => {
        const result = await getDatasetSchema.execute!({ type: 'dataset' }, ctx);
        const parsed = getDatasetSchemaOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('listOrganizations output matches schema', async () => {
        const result = await listOrganizations.execute!({ searchedResourceName: 'test' }, ctx);
        const parsed = listOrganizationsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getOrganizationDetails output matches schema', async () => {
        const result = await getOrganizationDetails.execute!(
            { id: KNOWN_ORGANIZATION_ID, searchedResourceName: 'test' },
            ctx,
        );
        const parsed = getOrganizationDetailsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getOrganizationActivity output matches schema', async () => {
        const result = await getOrganizationActivity.execute!(
            { id: KNOWN_ORGANIZATION_ID, limit: 3, searchedResourceName: 'test' },
            ctx,
        );
        const parsed = getOrganizationActivityOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('listGroups output matches schema', async () => {
        const result = await listGroups.execute!({ limit: 3, searchedResourceName: 'test' }, ctx);
        const parsed = listGroupsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('listTags output matches schema', async () => {
        const result = await listTags.execute!({ query: 'תחבורה', searchedResourceName: 'test' }, ctx);
        const parsed = listTagsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('searchResources output matches schema', async () => {
        const result = await searchResources.execute!({ query: 'תחבורה', limit: 3, searchedResourceName: 'test' }, ctx);
        const parsed = searchResourcesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getResourceDetails output matches schema', async () => {
        const result = await getResourceDetails.execute!(
            { id: KNOWN_DATASTORE_RESOURCE_ID, searchedResourceName: 'test' },
            ctx,
        );
        const parsed = getResourceDetailsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('queryDatastoreResource output matches schema', async () => {
        const result = await queryDatastoreResource.execute!(
            { resource_id: KNOWN_DATASTORE_RESOURCE_ID, limit: 3, searchedResourceName: 'test' },
            ctx,
        );
        const parsed = queryDatastoreResourceOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getStatus output matches schema', async () => {
        const result = await getStatus.execute!({}, ctx);
        const parsed = getStatusOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('listLicenses output matches schema', async () => {
        const result = await listLicenses.execute!({}, ctx);
        const parsed = listLicensesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);
});
