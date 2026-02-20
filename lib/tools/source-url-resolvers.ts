/**
 * Source URL Resolvers
 *
 * Client-side utility that auto-generates user-facing source URLs
 * from data tool inputs/outputs. This removes the dependency on
 * the agent explicitly calling generateDataGovSourceUrl / generateCbsSourceUrl.
 *
 * Tool names are derived from SOURCE_GENERATING_TOOL_NAMES (tool-names.ts),
 * which is type-validated against the tool object key unions.
 */

import { SOURCE_GENERATING_TOOL_NAMES, toToolPartTypeSet } from './tool-names';

const DATAGOV_PORTAL = 'https://data.gov.il/datasets';
const DATAGOV_ORG_PORTAL = 'https://data.gov.il/organization';

/** Set of tool-prefixed types for source-generating tools (e.g. 'tool-searchDatasets') */
const SOURCE_GENERATING_TOOL_TYPES = toToolPartTypeSet(SOURCE_GENERATING_TOOL_NAMES);

export interface ToolSource {
    url: string;
    title: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
}

/** Resolve searchedResourceName from output (priority) or input */
function getResourceName(input: unknown, output: unknown): string | undefined {
    return getString(output, 'searchedResourceName') ?? getString(input, 'searchedResourceName');
}

/**
 * Resolves a source URL from a data tool's part type, input, and output.
 *
 * Produces dynamic, context-aware titles by extracting tool-specific
 * fields (searchedResourceName, query, dataset title, series path, etc.).
 *
 * Returns null for non-data tools or failed outputs.
 */
export function resolveToolSourceUrl(toolType: string, input: unknown, output: unknown): ToolSource | null {
    if (!isRecord(output) || output.success !== true) return null;
    if (!SOURCE_GENERATING_TOOL_TYPES.has(toolType)) return null;

    const toolName = toolType.replace(/^tool-/, '');

    switch (toolName) {
        // ── DataGov: search-based tools ──────────────────────────────────
        case 'searchDatasets': {
            return {
                url: DATAGOV_PORTAL,
                title: 'חיפוש מאגרים - data.gov',
            };
        }

        case 'searchResources': {
            const query = getString(input, 'query');
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            return {
                url: apiUrl,
                title: resourceName ?? (query ? `חיפוש משאבים: ${query}` : 'חיפוש משאבים - data.gov.il'),
            };
        }

        // ── DataGov: detail tools (have searchedResourceName) ────────────
        case 'getDatasetDetails': {
            const dataset = isRecord(output) ? output.dataset : undefined;
            const name = getString(dataset, 'name');
            const title = getString(dataset, 'title') ?? getResourceName(input, output);
            if (!name) return null;
            return {
                url: `${DATAGOV_PORTAL}/${encodeURIComponent(name)}`,
                title: title ?? name,
            };
        }

        case 'getOrganizationDetails': {
            const org = isRecord(output) ? output.organization : undefined;
            const name = getString(org, 'name');
            const title = getString(org, 'title') ?? getResourceName(input, output);
            if (!name) return null;
            return {
                url: `${DATAGOV_ORG_PORTAL}/${encodeURIComponent(name)}`,
                title: title ?? name,
            };
        }

        case 'queryDatastoreResource': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            const query = getString(input, 'q');
            let title = resourceName ?? 'שאילתת נתונים';
            if (query) title += ` (${query})`;
            return { url: apiUrl, title };
        }

        case 'getResourceDetails': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            const resource = isRecord(output) ? output.resource : undefined;
            const name = getString(resource, 'name');
            return {
                url: apiUrl,
                title: resourceName ?? name ?? 'פרטי משאב - data.gov.il',
            };
        }

        // ── CBS: series tools ────────────────────────────────────────────
        case 'getCbsSeriesData':
        case 'getCbsSeriesDataByPath': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            return {
                url: apiUrl,
                title: resourceName ?? 'סדרה סטטיסטית - הלמ"ס',
            };
        }

        // ── CBS: price tools ─────────────────────────────────────────────
        case 'getCbsPriceData': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            return {
                url: apiUrl,
                title: resourceName ?? 'נתוני מחירים - הלמ"ס',
            };
        }

        case 'calculateCbsPriceIndex': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            return {
                url: apiUrl,
                title: resourceName ? `מחשבון הצמדה: ${resourceName}` : 'מחשבון הצמדה - הלמ"ס',
            };
        }

        // ── CBS: localities ──────────────────────────────────────────────
        case 'searchCbsLocalities': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            const query = getString(input, 'query');
            return {
                url: apiUrl,
                title: resourceName ?? (query ? `חיפוש יישובים: ${query}` : 'מילון יישובים - הלמ"ס'),
            };
        }

        // ── CBS: catalog/browse tools ────────────────────────────────────
        case 'browseCbsCatalog':
        case 'browseCbsCatalogPath': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            return { url: apiUrl, title: resourceName ?? 'קטלוג הלמ"ס' };
        }

        case 'browseCbsPriceIndices': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            const mode = getString(input, 'mode');
            const modeLabels: Record<string, string> = {
                chapters: 'פרקי מדדים',
                topics: 'נושאי מדדים',
                indices: 'קודי מדדים',
            };
            return {
                url: apiUrl,
                title: resourceName ?? (mode && modeLabels[mode]) ?? 'מדדי מחירים - הלמ"ס',
            };
        }

        default:
            return null;
    }
}
