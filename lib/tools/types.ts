/**
 * Tool Types
 *
 * Aggregates all tool input/output types from individual tool files.
 * This creates a single source of truth - the Zod schemas in each tool file.
 */

// Re-export all types from datagov tool files
// Import types for the ToolIOMap
import type { SearchDatasetsInput, SearchDatasetsOutput } from './datagov/search-datasets';
import type { GetDatasetDetailsInput, GetDatasetDetailsOutput } from './datagov/get-dataset-details';
import type { ListGroupsInput, ListGroupsOutput } from './datagov/list-groups';
import type { ListTagsInput, ListTagsOutput } from './datagov/list-tags';
import type { QueryDatastoreResourceInput, QueryDatastoreResourceOutput } from './datagov/query-datastore-resource';
import type { GetDatasetActivityInput, GetDatasetActivityOutput } from './datagov/get-dataset-activity';
import type { GetDatasetSchemaInput, GetDatasetSchemaOutput } from './datagov/get-dataset-schema';
import type { GetOrganizationActivityInput, GetOrganizationActivityOutput } from './datagov/get-organization-activity';
import type { GetOrganizationDetailsInput, GetOrganizationDetailsOutput } from './datagov/get-organization-details';
import type { GetResourceDetailsInput, GetResourceDetailsOutput } from './datagov/get-resource-details';
import type { GetStatusInput, GetStatusOutput } from './datagov/get-status';
import type { ListAllDatasetsInput, ListAllDatasetsOutput } from './datagov/list-all-datasets';
import type { ListLicensesInput, ListLicensesOutput } from './datagov/list-licenses';
import type { ListOrganizationsInput, ListOrganizationsOutput } from './datagov/list-organizations';
import type { SearchResourcesInput, SearchResourcesOutput } from './datagov/search-resources';
import type {
    DisplayBarChartInput,
    DisplayBarChartOutput,
    DisplayLineChartInput,
    DisplayLineChartOutput,
    DisplayPieChartInput,
    DisplayPieChartOutput,
} from './client/display-chart';
import type { BrowseCbsCatalogInput, BrowseCbsCatalogOutput } from './cbs/series/browse-cbs-catalog';
import type { GetCbsSeriesDataInput, GetCbsSeriesDataOutput } from './cbs/series/get-cbs-series-data';
import type { BrowseCbsPriceIndicesInput, BrowseCbsPriceIndicesOutput } from './cbs/price/browse-cbs-price-indices';
import type { GetCbsPriceDataInput, GetCbsPriceDataOutput } from './cbs/price/get-cbs-price-data';
import type { CalculateCbsPriceIndexInput, CalculateCbsPriceIndexOutput } from './cbs/price/calculate-cbs-price-index';
import type { SearchCbsLocalitiesInput, SearchCbsLocalitiesOutput } from './cbs/dictionary/search-cbs-localities';

export type { SearchDatasetsInput, SearchDatasetsOutput } from './datagov/search-datasets';

export type { GetDatasetDetailsInput, GetDatasetDetailsOutput } from './datagov/get-dataset-details';

export type { ListGroupsInput, ListGroupsOutput } from './datagov/list-groups';

export type { ListTagsInput, ListTagsOutput } from './datagov/list-tags';

export type { QueryDatastoreResourceInput, QueryDatastoreResourceOutput } from './datagov/query-datastore-resource';

export type { GetDatasetActivityInput, GetDatasetActivityOutput } from './datagov/get-dataset-activity';

export type { GetDatasetSchemaInput, GetDatasetSchemaOutput } from './datagov/get-dataset-schema';

export type { GetOrganizationActivityInput, GetOrganizationActivityOutput } from './datagov/get-organization-activity';

export type { GetOrganizationDetailsInput, GetOrganizationDetailsOutput } from './datagov/get-organization-details';

export type { GetResourceDetailsInput, GetResourceDetailsOutput } from './datagov/get-resource-details';

export type { GetStatusInput, GetStatusOutput } from './datagov/get-status';

export type { ListAllDatasetsInput, ListAllDatasetsOutput } from './datagov/list-all-datasets';

export type { ListLicensesInput, ListLicensesOutput } from './datagov/list-licenses';

export type { ListOrganizationsInput, ListOrganizationsOutput } from './datagov/list-organizations';

export type { SearchResourcesInput, SearchResourcesOutput } from './datagov/search-resources';

// Client display tool types
export type {
    DisplayBarChartInput,
    DisplayBarChartOutput,
    DisplayLineChartInput,
    DisplayLineChartOutput,
    DisplayPieChartInput,
    DisplayPieChartOutput,
    DisplayChartInput,
    ChartType,
} from './client/display-chart';

// CBS tool types
export type { BrowseCbsCatalogInput, BrowseCbsCatalogOutput } from './cbs/series/browse-cbs-catalog';

export type { GetCbsSeriesDataInput, GetCbsSeriesDataOutput } from './cbs/series/get-cbs-series-data';

export type { BrowseCbsPriceIndicesInput, BrowseCbsPriceIndicesOutput } from './cbs/price/browse-cbs-price-indices';

export type { GetCbsPriceDataInput, GetCbsPriceDataOutput } from './cbs/price/get-cbs-price-data';

export type { CalculateCbsPriceIndexInput, CalculateCbsPriceIndexOutput } from './cbs/price/calculate-cbs-price-index';

export type { SearchCbsLocalitiesInput, SearchCbsLocalitiesOutput } from './cbs/dictionary/search-cbs-localities';

// ============================================================================
// Tool Map Type
// ============================================================================

type NetworkAgentInput = {
    prompt: string;
};

export interface ToolIOMap {
    searchDatasets: {
        input: SearchDatasetsInput;
        output: SearchDatasetsOutput;
    };
    getDatasetDetails: {
        input: GetDatasetDetailsInput;
        output: GetDatasetDetailsOutput;
    };
    listGroups: {
        input: ListGroupsInput;
        output: ListGroupsOutput;
    };
    listTags: {
        input: ListTagsInput;
        output: ListTagsOutput;
    };
    queryDatastoreResource: {
        input: QueryDatastoreResourceInput;
        output: QueryDatastoreResourceOutput;
    };
    getDatasetActivity: {
        input: GetDatasetActivityInput;
        output: GetDatasetActivityOutput;
    };
    getDatasetSchema: {
        input: GetDatasetSchemaInput;
        output: GetDatasetSchemaOutput;
    };
    getOrganizationActivity: {
        input: GetOrganizationActivityInput;
        output: GetOrganizationActivityOutput;
    };
    getOrganizationDetails: {
        input: GetOrganizationDetailsInput;
        output: GetOrganizationDetailsOutput;
    };
    getResourceDetails: {
        input: GetResourceDetailsInput;
        output: GetResourceDetailsOutput;
    };
    getStatus: {
        input: GetStatusInput;
        output: GetStatusOutput;
    };
    listAllDatasets: {
        input: ListAllDatasetsInput;
        output: ListAllDatasetsOutput;
    };
    listLicenses: {
        input: ListLicensesInput;
        output: ListLicensesOutput;
    };
    listOrganizations: {
        input: ListOrganizationsInput;
        output: ListOrganizationsOutput;
    };
    searchResources: {
        input: SearchResourcesInput;
        output: SearchResourcesOutput;
    };
    displayBarChart: {
        input: DisplayBarChartInput;
        output: DisplayBarChartOutput;
    };
    displayLineChart: {
        input: DisplayLineChartInput;
        output: DisplayLineChartOutput;
    };
    displayPieChart: {
        input: DisplayPieChartInput;
        output: DisplayPieChartOutput;
    };
    browseCbsCatalog: {
        input: BrowseCbsCatalogInput;
        output: BrowseCbsCatalogOutput;
    };
    getCbsSeriesData: {
        input: GetCbsSeriesDataInput;
        output: GetCbsSeriesDataOutput;
    };
    browseCbsPriceIndices: {
        input: BrowseCbsPriceIndicesInput;
        output: BrowseCbsPriceIndicesOutput;
    };
    getCbsPriceData: {
        input: GetCbsPriceDataInput;
        output: GetCbsPriceDataOutput;
    };
    calculateCbsPriceIndex: {
        input: CalculateCbsPriceIndexInput;
        output: CalculateCbsPriceIndexOutput;
    };
    searchCbsLocalities: {
        input: SearchCbsLocalitiesInput;
        output: SearchCbsLocalitiesOutput;
    };
    'agent-cbsAgent': {
        input: NetworkAgentInput;
        output: SearchCbsLocalitiesOutput;
    };
    'agent-datagovAgent': {
        input: NetworkAgentInput;
        output: SearchCbsLocalitiesOutput;
    };
    'agent-routingAgent': {
        input: NetworkAgentInput;
        output: SearchCbsLocalitiesOutput;
    };
    'agent-visualizationAgent': {
        input: NetworkAgentInput;
        output: SearchCbsLocalitiesOutput;
    };
}

export type ToolName = keyof ToolIOMap;

export type ToolInput<T extends ToolName> = ToolIOMap[T]['input'];
export type ToolOutput<T extends ToolName> = ToolIOMap[T]['output'];
