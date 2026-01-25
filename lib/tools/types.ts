/**
 * Tool Types
 *
 * Aggregates all tool input/output types from individual tool files.
 * This creates a single source of truth - the Zod schemas in each tool file.
 */

// Re-export all types from tool files
export type {
  SearchDatasetsInput,
  SearchDatasetsOutput,
} from './search-datasets';

export type {
  GetDatasetDetailsInput,
  GetDatasetDetailsOutput,
} from './get-dataset-details';

export type {
  ListGroupsInput,
  ListGroupsOutput,
} from './list-groups';

export type {
  ListTagsInput,
  ListTagsOutput,
} from './list-tags';

export type {
  QueryDatastoreResourceInput,
  QueryDatastoreResourceOutput,
} from './query-datastore-resource';

export type {
  GetDatasetActivityInput,
  GetDatasetActivityOutput,
} from './get-dataset-activity';

export type {
  GetDatasetSchemaInput,
  GetDatasetSchemaOutput,
} from './get-dataset-schema';

export type {
  GetOrganizationActivityInput,
  GetOrganizationActivityOutput,
} from './get-organization-activity';

export type {
  GetOrganizationDetailsInput,
  GetOrganizationDetailsOutput,
} from './get-organization-details';

export type {
  GetResourceDetailsInput,
  GetResourceDetailsOutput,
} from './get-resource-details';

export type {
  GetStatusInput,
  GetStatusOutput,
} from './get-status';

export type {
  ListAllDatasetsInput,
  ListAllDatasetsOutput,
} from './list-all-datasets';

export type {
  ListLicensesInput,
  ListLicensesOutput,
} from './list-licenses';

export type {
  ListOrganizationsInput,
  ListOrganizationsOutput,
} from './list-organizations';

export type {
  SearchResourcesInput,
  SearchResourcesOutput,
} from './search-resources';

// Import types for the ToolIOMap
import type { SearchDatasetsInput, SearchDatasetsOutput } from './search-datasets';
import type { GetDatasetDetailsInput, GetDatasetDetailsOutput } from './get-dataset-details';
import type { ListGroupsInput, ListGroupsOutput } from './list-groups';
import type { ListTagsInput, ListTagsOutput } from './list-tags';
import type { QueryDatastoreResourceInput, QueryDatastoreResourceOutput } from './query-datastore-resource';
import type { GetDatasetActivityInput, GetDatasetActivityOutput } from './get-dataset-activity';
import type { GetDatasetSchemaInput, GetDatasetSchemaOutput } from './get-dataset-schema';
import type { GetOrganizationActivityInput, GetOrganizationActivityOutput } from './get-organization-activity';
import type { GetOrganizationDetailsInput, GetOrganizationDetailsOutput } from './get-organization-details';
import type { GetResourceDetailsInput, GetResourceDetailsOutput } from './get-resource-details';
import type { GetStatusInput, GetStatusOutput } from './get-status';
import type { ListAllDatasetsInput, ListAllDatasetsOutput } from './list-all-datasets';
import type { ListLicensesInput, ListLicensesOutput } from './list-licenses';
import type { ListOrganizationsInput, ListOrganizationsOutput } from './list-organizations';
import type { SearchResourcesInput, SearchResourcesOutput } from './search-resources';

// ============================================================================
// Tool Map Type
// ============================================================================

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
}

export type ToolName = keyof ToolIOMap;

export type ToolInput<T extends ToolName> = ToolIOMap[T]['input'];
export type ToolOutput<T extends ToolName> = ToolIOMap[T]['output'];
