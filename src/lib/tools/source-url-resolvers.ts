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

import type { SourceUrlType } from '@/components/chat/types';
import { SOURCE_GENERATING_TOOL_NAMES, toToolPartTypeSet } from './tool-names';

/** Set of tool-prefixed types for source-generating tools (e.g. 'tool-searchDatasets') */
const SOURCE_GENERATING_TOOL_TYPES = toToolPartTypeSet(SOURCE_GENERATING_TOOL_NAMES);

export interface ToolSource {
    url: string;
    title: string;
    /** Whether this links to a portal page or an API endpoint */
    urlType: SourceUrlType;
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
 * Prefers `portalUrl` from tool output when available (server-computed,
 * includes /he/ prefix and org name). Falls back to `apiUrl` for tools
 * that don't provide a portal URL.
 *
 * Returns null for non-data tools or failed outputs.
 */
export function resolveToolSourceUrl(toolType: string, input: unknown, output: unknown): ToolSource | null {
    if (!isRecord(output) || output.success !== true) return null;
    if (!SOURCE_GENERATING_TOOL_TYPES.has(toolType)) return null;

    const toolName = toolType.replace(/^tool-/, '');

    switch (toolName) {
        // ── DataGov: detail/query tools ──────────────────────────────────
        case 'getDatasetDetails': {
            const portalUrl = getString(output, 'portalUrl');
            if (!portalUrl) return null;
            const dataset = isRecord(output) ? output.dataset : undefined;
            const title = getString(dataset, 'title') ?? getResourceName(input, output);
            const name = getString(dataset, 'name');
            return {
                url: portalUrl,
                title: title ?? name ?? 'מאגר מידע - data.gov.il',
                urlType: 'portal',
            };
        }

        case 'getOrganizationDetails': {
            const portalUrl = getString(output, 'portalUrl');
            if (!portalUrl) return null;
            const org = isRecord(output) ? output.organization : undefined;
            const title = getString(org, 'title') ?? getResourceName(input, output);
            const name = getString(org, 'name');
            return {
                url: portalUrl,
                title: title ?? name ?? 'ארגון - data.gov.il',
                urlType: 'portal',
            };
        }

        case 'queryDatastoreResource': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            const query = getString(input, 'q');
            let title = resourceName ? `שאילתת נתונים — ${resourceName}` : 'שאילתת נתונים';
            if (query) title += ` (${query})`;
            return { url: apiUrl, title, urlType: 'api' };
        }

        case 'getResourceDetails': {
            const portalUrl = getString(output, 'portalUrl');
            const apiUrl = getString(output, 'apiUrl');
            const url = portalUrl ?? apiUrl;
            if (!url) return null;
            const resourceName = getResourceName(input, output);
            const resource = isRecord(output) ? output.resource : undefined;
            const name = getString(resource, 'name');
            return {
                url,
                title: resourceName ?? name ?? 'פרטי משאב - data.gov.il',
                urlType: portalUrl ? 'portal' : 'api',
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
                title: resourceName ? `סדרה סטטיסטית — ${resourceName}` : 'סדרה סטטיסטית - הלמ"ס',
                urlType: 'api',
            };
        }

        // ── CBS: price tools ─────────────────────────────────────────────
        case 'getCbsPriceData': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            return {
                url: apiUrl,
                title: resourceName ? `נתוני מחירים — ${resourceName}` : 'נתוני מחירים - הלמ"ס',
                urlType: 'api',
            };
        }

        case 'calculateCbsPriceIndex': {
            const apiUrl = getString(output, 'apiUrl');
            if (!apiUrl) return null;
            const resourceName = getResourceName(input, output);
            return {
                url: apiUrl,
                title: resourceName ? `מחשבון הצמדה — ${resourceName}` : 'מחשבון הצמדה - הלמ"ס',
                urlType: 'api',
            };
        }

        default:
            return null;
    }
}
