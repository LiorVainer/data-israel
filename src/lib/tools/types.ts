/**
 * Tool Types
 *
 * Aggregates all tool input/output types from individual tool files.
 * The ToolIOMap is auto-derived from tool objects — no manual synchronization needed.
 */

import type { InferToolInput, InferToolOutput } from 'ai';
import type { ClientTools } from './client';
import type { DataGovTools } from './datagov';
import type { CbsTools } from './cbs';
import type { agents } from '@/agents/mastra';

// ============================================================================
// Individual Type Re-exports
// ============================================================================

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

export type { BrowseCbsCatalogPathInput, BrowseCbsCatalogPathOutput } from './cbs/series/browse-cbs-catalog-path';

export type { GetCbsSeriesDataInput, GetCbsSeriesDataOutput } from './cbs/series/get-cbs-series-data';

export type {
    GetCbsSeriesDataByPathInput,
    GetCbsSeriesDataByPathOutput,
} from './cbs/series/get-cbs-series-data-by-path';

export type { BrowseCbsPriceIndicesInput, BrowseCbsPriceIndicesOutput } from './cbs/price/browse-cbs-price-indices';

export type { GetCbsPriceDataInput, GetCbsPriceDataOutput } from './cbs/price/get-cbs-price-data';

export type { CalculateCbsPriceIndexInput, CalculateCbsPriceIndexOutput } from './cbs/price/calculate-cbs-price-index';

export type { SearchCbsLocalitiesInput, SearchCbsLocalitiesOutput } from './cbs/dictionary/search-cbs-localities';

// Client tool types
export type { SuggestFollowUpsInput, SuggestFollowUpsOutput } from './client/suggest-follow-ups';

// Source URL tool types
export type { GenerateDataGovSourceUrlInput, GenerateDataGovSourceUrlOutput } from './datagov/generate-source-url';

export type { GenerateCbsSourceUrlInput, GenerateCbsSourceUrlOutput } from './cbs/source/generate-source-url';

// ============================================================================
// Tool Map Type (auto-derived from tool objects)
// ============================================================================

/** All tool objects combined — source of truth for tool names and schemas */
type AllToolObjects = typeof ClientTools & typeof DataGovTools & typeof CbsTools;

/** ToolIOMap for regular tools: input/output inferred from Zod schemas */
type DerivedToolIOMap = {
    [K in keyof AllToolObjects]: {
        input: InferToolInput<AllToolObjects[K]>;
        output: InferToolOutput<AllToolObjects[K]>;
    };
};

/** Agent-as-tool schema: Mastra converts sub-agents to tools with this fixed shape */
type NetworkAgentInput = { prompt: string };
type NetworkAgentOutput = { text: string };

/** ToolIOMap for agent-as-tool entries: derived from agents const */
type AgentToolIOMap = {
    [K in `agent-${Extract<keyof typeof agents, string>}`]: {
        input: NetworkAgentInput;
        output: NetworkAgentOutput;
    };
};

/** Combined map: regular tools + agent-as-tool entries */
export type ToolIOMap = DerivedToolIOMap & AgentToolIOMap;

export type ToolName = keyof ToolIOMap;

export type ToolInput<T extends ToolName> = ToolIOMap[T]['input'];
export type ToolOutput<T extends ToolName> = ToolIOMap[T]['output'];
