/**
 * Tool Name Constants
 *
 * Single source of truth for tool name categorization.
 * Each array is validated via `satisfies` against the key-union type
 * exported by the corresponding tool index file (DataGovToolName,
 * CbsToolName, ClientToolName). If a tool is renamed or removed
 * from its ToolObject, these arrays will produce a compile error.
 */

import type { DataGovToolName } from './datagov';
import type { CbsToolName } from './cbs';
import type { ClientToolName } from './client';

/** DataGov tools that fetch data from data.gov.il */
export const DATAGOV_TOOL_NAMES = [
    'searchDatasets',
    'listAllDatasets',
    'getDatasetDetails',
    'getDatasetActivity',
    'getDatasetSchema',
    'listOrganizations',
    'getOrganizationDetails',
    'getOrganizationActivity',
    'listGroups',
    'listTags',
    'searchResources',
    'getResourceDetails',
    'queryDatastoreResource',
    'getStatus',
    'listLicenses',
    'generateDataGovSourceUrl',
] as const satisfies readonly DataGovToolName[];

/** CBS tools that fetch data from the Central Bureau of Statistics */
export const CBS_TOOL_NAMES = [
    'browseCbsCatalog',
    'browseCbsCatalogPath',
    'getCbsSeriesData',
    'getCbsSeriesDataByPath',
    'browseCbsPriceIndices',
    'getCbsPriceData',
    'calculateCbsPriceIndex',
    'searchCbsLocalities',
    'generateCbsSourceUrl',
] as const satisfies readonly CbsToolName[];

/** Client-side tools (charts, suggestions) */
export const CLIENT_TOOL_NAMES = [
    'displayBarChart',
    'displayLineChart',
    'displayPieChart',
    'suggestFollowUps',
] as const satisfies readonly ClientToolName[];

/** All tool names (union of all categories) */
export type AllToolName = DataGovToolName | CbsToolName | ClientToolName;

/** Dedicated source URL generation tools */
export const SOURCE_URL_TOOL_NAMES = [
    'generateDataGovSourceUrl',
    'generateCbsSourceUrl',
] as const satisfies readonly AllToolName[];

/**
 * Data tools whose outputs should auto-generate source links.
 * Only tools that fetch actual dataset/datasource data — not search or browse tools.
 */
export const SOURCE_GENERATING_TOOL_NAMES = [
    'getDatasetDetails',
    'getOrganizationDetails',
    'getResourceDetails',
    'queryDatastoreResource',
    'getCbsSeriesData',
    'getCbsSeriesDataByPath',
    'getCbsPriceData',
    'calculateCbsPriceIndex',
] as const satisfies readonly AllToolName[];

/** Prefix a tool name with 'tool-' for matching against message part types */
export function toToolPartType(name: string): string {
    return `tool-${name}`;
}

/** Build a Set of tool-prefixed type strings from an array of tool names */
export function toToolPartTypeSet(names: readonly string[]): Set<string> {
    return new Set(names.map(toToolPartType));
}
