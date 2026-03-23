/**
 * DataGov Tools
 *
 * Re-exports all tools for the Israeli open data portal (CKAN API).
 * Collects source URL resolvers for tools that produce source links.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

import { searchDatasets } from './search-datasets.tool';
import { listAllDatasets } from './list-all-datasets.tool';
import { getDatasetDetails, resolveSourceUrl as getDatasetDetailsResolver } from './get-dataset-details.tool';
import { getDatasetActivity } from './get-dataset-activity.tool';
import { getDatasetSchema } from './get-dataset-schema.tool';
import { listOrganizations } from './list-organizations.tool';
import {
    getOrganizationDetails,
    resolveSourceUrl as getOrganizationDetailsResolver,
} from './get-organization-details.tool';
import { getOrganizationActivity } from './get-organization-activity.tool';
import { listGroups } from './list-groups.tool';
import { listTags } from './list-tags.tool';
import { searchResources } from './search-resources.tool';
import {
    getResourceDetails,
    resolveSourceUrl as getResourceDetailsResolver,
} from './get-resource-details.tool';
import {
    queryDatastoreResource,
    resolveSourceUrl as queryDatastoreResourceResolver,
} from './query-datastore-resource.tool';
import { getStatus } from './get-status.tool';
import { listLicenses } from './list-licenses.tool';
import { generateDataGovSourceUrl } from './generate-source-url.tool';

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
    generateDataGovSourceUrl,
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
    generateDataGovSourceUrl,
};

/** Union of all DataGov tool names */
export type DataGovToolName = keyof typeof DataGovTools;

/** Source URL resolvers for DataGov tools that produce source links */
export const datagovSourceResolvers: Partial<Record<DataGovToolName, ToolSourceResolver>> = {
    getDatasetDetails: getDatasetDetailsResolver,
    getOrganizationDetails: getOrganizationDetailsResolver,
    getResourceDetails: getResourceDetailsResolver,
    queryDatastoreResource: queryDatastoreResourceResolver,
};
