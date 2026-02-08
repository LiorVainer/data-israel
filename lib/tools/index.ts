/**
 * AI SDK Tools for Data.gov.il and CBS
 *
 * Exports all agent tools for Israeli open data exploration
 */

// CBS tool types
export type {
    BrowseCbsCatalogInput,
    BrowseCbsCatalogOutput,
    BrowseCbsCatalogPathInput,
    BrowseCbsCatalogPathOutput,
    GetCbsSeriesDataInput,
    GetCbsSeriesDataOutput,
    GetCbsSeriesDataByPathInput,
    GetCbsSeriesDataByPathOutput,
    BrowseCbsPriceIndicesInput,
    BrowseCbsPriceIndicesOutput,
    GetCbsPriceDataInput,
    GetCbsPriceDataOutput,
    CalculateCbsPriceIndexInput,
    CalculateCbsPriceIndexOutput,
    SearchCbsLocalitiesInput,
    SearchCbsLocalitiesOutput,
} from './types';

// Type definitions
export type {
    ToolIOMap,
    ToolName,
    ToolInput,
    ToolOutput,
    SearchDatasetsInput,
    SearchDatasetsOutput,
    GetDatasetDetailsInput,
    GetDatasetDetailsOutput,
    ListGroupsInput,
    ListGroupsOutput,
    ListTagsInput,
    ListTagsOutput,
    QueryDatastoreResourceInput,
    QueryDatastoreResourceOutput,
    GetDatasetActivityInput,
    GetDatasetActivityOutput,
    GetDatasetSchemaInput,
    GetDatasetSchemaOutput,
    GetOrganizationActivityInput,
    GetOrganizationActivityOutput,
    GetOrganizationDetailsInput,
    GetOrganizationDetailsOutput,
    GetResourceDetailsInput,
    GetResourceDetailsOutput,
    GetStatusInput,
    GetStatusOutput,
    ListAllDatasetsInput,
    ListAllDatasetsOutput,
    ListLicensesInput,
    ListLicensesOutput,
    ListOrganizationsInput,
    ListOrganizationsOutput,
    SearchResourcesInput,
    SearchResourcesOutput,
    DisplayBarChartInput,
    DisplayBarChartOutput,
    DisplayLineChartInput,
    DisplayLineChartOutput,
    DisplayPieChartInput,
    DisplayPieChartOutput,
    DisplayChartInput,
    ChartType,
    SuggestFollowUpsInput,
    SuggestFollowUpsOutput,
    GenerateDataGovSourceUrlInput,
    GenerateDataGovSourceUrlOutput,
    GenerateCbsSourceUrlInput,
    GenerateCbsSourceUrlOutput,
} from './types';

// Data.gov.il tools
export { getStatus } from './datagov/get-status';
export { listLicenses } from './datagov/list-licenses';
export { getDatasetSchema } from './datagov/get-dataset-schema';
export { searchDatasets } from './datagov/search-datasets';
export { listAllDatasets } from './datagov/list-all-datasets';
export { getDatasetDetails } from './datagov/get-dataset-details';
export { getDatasetActivity } from './datagov/get-dataset-activity';
export { listOrganizations } from './datagov/list-organizations';
export { getOrganizationDetails } from './datagov/get-organization-details';
export { getOrganizationActivity } from './datagov/get-organization-activity';
export { listGroups } from './datagov/list-groups';
export { listTags } from './datagov/list-tags';
export { searchResources } from './datagov/search-resources';
export { getResourceDetails } from './datagov/get-resource-details';
export { queryDatastoreResource } from './datagov/query-datastore-resource';

// Client-side display tools
export { displayBarChart, displayLineChart, displayPieChart } from './client/display-chart';
export { suggestFollowUps } from './client/suggest-follow-ups';

// Source URL tools
export { generateDataGovSourceUrl } from './datagov/generate-source-url';
export { generateCbsSourceUrl } from './cbs/source/generate-source-url';

// CBS Series tools
export { browseCbsCatalog } from './cbs/series/browse-cbs-catalog';
export { browseCbsCatalogPath } from './cbs/series/browse-cbs-catalog-path';
export { getCbsSeriesData } from './cbs/series/get-cbs-series-data';
export { getCbsSeriesDataByPath } from './cbs/series/get-cbs-series-data-by-path';

// CBS Price Index tools
export { browseCbsPriceIndices } from './cbs/price/browse-cbs-price-indices';
export { getCbsPriceData } from './cbs/price/get-cbs-price-data';
export { calculateCbsPriceIndex } from './cbs/price/calculate-cbs-price-index';

// CBS Dictionary tools
export { searchCbsLocalities } from './cbs/dictionary/search-cbs-localities';
