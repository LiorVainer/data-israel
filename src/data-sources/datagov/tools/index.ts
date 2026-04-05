/**
 * DataGov Tools
 *
 * Re-exports all tools for the Israeli open data portal (CKAN API).
 * Collects source URL resolvers for tools that produce source links.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

import { searchDatasets } from './search-datasets.tool';
import { listAllDatasets } from './list-all-datasets.tool';
import {
    getDatasetDetails,
    resolveSourceUrl as getDatasetDetailsResolver,
    type GetDatasetDetailsInput,
    type GetDatasetDetailsOutput,
} from './get-dataset-details.tool';
import { getDatasetActivity } from './get-dataset-activity.tool';
import { getDatasetSchema } from './get-dataset-schema.tool';
import { listOrganizations } from './list-organizations.tool';
import {
    getOrganizationDetails,
    resolveSourceUrl as getOrganizationDetailsResolver,
    type GetOrganizationDetailsInput,
    type GetOrganizationDetailsOutput,
} from './get-organization-details.tool';
import { getOrganizationActivity } from './get-organization-activity.tool';
import { listGroups } from './list-groups.tool';
import { listTags } from './list-tags.tool';
import { searchResources } from './search-resources.tool';
import {
    getResourceDetails,
    resolveSourceUrl as getResourceDetailsResolver,
    type GetResourceDetailsInput,
    type GetResourceDetailsOutput,
} from './get-resource-details.tool';
import {
    queryDatastoreResource,
    resolveSourceUrl as queryDatastoreResourceResolver,
    type QueryDatastoreResourceInput,
    type QueryDatastoreResourceOutput,
} from './query-datastore-resource.tool';
import { getStatus } from './get-status.tool';
import { listLicenses } from './list-licenses.tool';

export {
    searchDatasets,
    listAllDatasets,
    getDatasetDetails,
    getDatasetActivity,
    getDatasetSchema,
    listOrganizations,
    getOrganizationDetails,
    getOrganizationActivity,
    listGroups,
    listTags,
    searchResources,
    getResourceDetails,
    queryDatastoreResource,
    getStatus,
    listLicenses,
};

/** All DataGov tools keyed by tool ID */
export const DataGovTools = {
    searchDatasets,
    listAllDatasets,
    getDatasetDetails,
    getDatasetActivity,
    getDatasetSchema,
    listOrganizations,
    getOrganizationDetails,
    getOrganizationActivity,
    listGroups,
    listTags,
    searchResources,
    getResourceDetails,
    queryDatastoreResource,
    getStatus,
    listLicenses,
};

/** Union of all DataGov tool names */
export type DataGovToolName = keyof typeof DataGovTools;

/**
 * Custom source URL resolvers for DataGov tools that need typed access to nested output.
 * Each resolver uses tool-specific generic params internally; the record widens to
 * ToolSourceResolver for registry integration (safe — runtime values match specific types).
 */
export const datagovSourceResolvers: Partial<Record<DataGovToolName, ToolSourceResolver>> = {
    getDatasetDetails: getDatasetDetailsResolver as ToolSourceResolver,
    getOrganizationDetails: getOrganizationDetailsResolver as ToolSourceResolver,
    getResourceDetails: getResourceDetailsResolver as ToolSourceResolver,
    queryDatastoreResource: queryDatastoreResourceResolver as ToolSourceResolver,
};

// Re-export typed resolver input/output types for downstream consumers
export type {
    GetDatasetDetailsInput,
    GetDatasetDetailsOutput,
    GetOrganizationDetailsInput,
    GetOrganizationDetailsOutput,
    GetResourceDetailsInput,
    GetResourceDetailsOutput,
    QueryDatastoreResourceInput,
    QueryDatastoreResourceOutput,
};

// ============================================================================
// Resource extractors for ChainOfThought UI chips
// ============================================================================

import type { ToolResourceExtractor } from '@/data-sources/types';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' && val.length > 0 ? val : undefined;
}

/** Extractor for search tools that use `query` or `q` input fields */
const searchExtractor: ToolResourceExtractor = (input) => {
    const name = getString(input, 'query') ?? getString(input, 'q');
    return name ? { name } : null;
};

/** Extractor for tools with `searchedResourceName` input field */
const resourceNameExtractor: ToolResourceExtractor = (input, output) => {
    const name = getString(input, 'searchedResourceName');
    const url = getString(output, 'apiUrl');
    if (!name && !url) return null;
    return { name, url: url ?? undefined };
};

/** Extractor for dataset detail tools — uses dataset.title from output */
const datasetDetailExtractor: ToolResourceExtractor = (input, output) => {
    const resourceName = getString(input, 'searchedResourceName');
    const datasetTitle = getString(isRecord(output) ? output.dataset : undefined, 'title');
    const name = resourceName ?? datasetTitle;
    const url = getString(output, 'apiUrl');
    if (!name && !url) return null;
    return { name, url: url ?? undefined };
};

/** Extractor for organization detail tools — uses organization.title from output */
const organizationDetailExtractor: ToolResourceExtractor = (input, output) => {
    const resourceName = getString(input, 'searchedResourceName');
    const orgTitle = getString(isRecord(output) ? output.organization : undefined, 'title');
    const name = resourceName ?? orgTitle;
    const url = getString(output, 'apiUrl');
    if (!name && !url) return null;
    return { name, url: url ?? undefined };
};

/** Resource extractors for DataGov tools */
export const datagovResourceExtractors: Partial<Record<DataGovToolName, ToolResourceExtractor>> = {
    searchDatasets: searchExtractor,
    listAllDatasets: searchExtractor,
    getDatasetDetails: datasetDetailExtractor,
    getDatasetActivity: resourceNameExtractor,
    getDatasetSchema: resourceNameExtractor,
    listOrganizations: searchExtractor,
    getOrganizationDetails: organizationDetailExtractor,
    getOrganizationActivity: resourceNameExtractor,
    searchResources: searchExtractor,
    getResourceDetails: resourceNameExtractor,
    queryDatastoreResource: resourceNameExtractor,
};
