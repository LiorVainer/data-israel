/**
 * Data.gov.il Tools
 *
 * Re-exports all tools for the Israeli open data portal (CKAN API)
 */

export { getStatus } from './get-status';
export { listLicenses } from './list-licenses';
export { getDatasetSchema } from './get-dataset-schema';
export { searchDatasets } from './search-datasets';
export { listAllDatasets } from './list-all-datasets';
export { getDatasetDetails } from './get-dataset-details';
export { getDatasetActivity } from './get-dataset-activity';
export { listOrganizations } from './list-organizations';
export { getOrganizationDetails } from './get-organization-details';
export { getOrganizationActivity } from './get-organization-activity';
export { listGroups } from './list-groups';
export { listTags } from './list-tags';
export { searchResources } from './search-resources';
export { getResourceDetails } from './get-resource-details';
export { queryDatastoreResource } from './query-datastore-resource';
export { generateDataGovSourceUrl } from './generate-source-url';

import { getStatus } from './get-status';
import { listLicenses } from './list-licenses';
import { getDatasetSchema } from './get-dataset-schema';
import { searchDatasets } from './search-datasets';
import { listAllDatasets } from './list-all-datasets';
import { getDatasetDetails } from './get-dataset-details';
import { getDatasetActivity } from './get-dataset-activity';
import { listOrganizations } from './list-organizations';
import { getOrganizationDetails } from './get-organization-details';
import { getOrganizationActivity } from './get-organization-activity';
import { listGroups } from './list-groups';
import { listTags } from './list-tags';
import { searchResources } from './search-resources';
import { getResourceDetails } from './get-resource-details';
import { queryDatastoreResource } from './query-datastore-resource';
import { generateDataGovSourceUrl } from './generate-source-url';

/** Union of all DataGov tool names, derived from the DataGovTools object */
export type DataGovToolName = keyof typeof DataGovTools;

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
