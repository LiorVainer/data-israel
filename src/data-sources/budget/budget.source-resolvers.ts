/**
 * BudgetKey Source URL Resolvers
 *
 * Returns portal URLs to https://next.obudget.org for BudgetKey tool results.
 */

import type { ToolSourceResolver } from '@/data-sources/types';
import type { BudgetToolName } from './budget.tools';

const BUDGET_PORTAL_URL = 'https://next.obudget.org';

/**
 * Extract a string field from an unknown object safely.
 */
function getString(obj: unknown, key: string): string | undefined {
    if (typeof obj === 'object' && obj !== null && key in obj) {
        const val = (obj as Record<string, unknown>)[key];
        return typeof val === 'string' ? val : undefined;
    }
    return undefined;
}

/**
 * Extract the first `item_url` from search_results or query rows in the output.
 * BudgetKey API returns results with `item_url: "https://next.obudget.org/i/..."` per item.
 */
function getFirstItemUrl(output: unknown): string | undefined {
    if (typeof output !== 'object' || output === null) return undefined;
    const out = output as Record<string, unknown>;

    // DatasetFullTextSearch: { search_results: [{ item_url, title, code }] }
    const searchResults = out.search_results;
    if (Array.isArray(searchResults) && searchResults.length > 0) {
        const first = searchResults[0] as Record<string, unknown>;
        if (typeof first?.item_url === 'string') return first.item_url;
    }

    // DatasetDBQuery: { rows: [{ item_url }] } or direct array with item_url
    const rows = out.rows;
    if (Array.isArray(rows) && rows.length > 0) {
        const first = rows[0] as Record<string, unknown>;
        if (typeof first?.item_url === 'string') return first.item_url;
    }

    return undefined;
}

/** Resolver for DatasetInfo — links to the portal search page */
const resolveDatasetInfo: ToolSourceResolver = (input, _output) => {
    const dataset = getString(input, 'dataset');
    if (!dataset) return [];
    return [
        {
            url: `${BUDGET_PORTAL_URL}/s?q=${encodeURIComponent(dataset)}`,
            title: `מאגר: ${dataset}`,
            urlType: 'portal',
        },
    ];
};

/** Resolver for DatasetFullTextSearch — uses item_url from first result, falls back to search */
const resolveDatasetFullTextSearch: ToolSourceResolver = (input, output) => {
    const q = getString(input, 'q');
    const dataset = getString(input, 'dataset');

    // Try to get a direct item link from the first result
    const itemUrl = getFirstItemUrl(output);
    if (itemUrl) {
        return [
            {
                url: itemUrl,
                title: q ? `חיפוש: ${q}` : `מאגר: ${dataset ?? 'תקציב'}`,
                urlType: 'portal',
            },
        ];
    }

    // Fallback to search page
    if (!q && !dataset) return [];
    const searchTerm = q ?? dataset ?? '';
    return [
        {
            url: `${BUDGET_PORTAL_URL}/s?q=${encodeURIComponent(searchTerm)}`,
            title: q ? `חיפוש: ${q}` : `מאגר: ${dataset}`,
            urlType: 'portal',
        },
    ];
};

/** Resolver for DatasetDBQuery — uses item_url from rows, download_url, or search fallback */
const resolveDatasetDBQuery: ToolSourceResolver = (input, output) => {
    // Try direct item link from first row
    const itemUrl = getFirstItemUrl(output);
    if (itemUrl) {
        return [
            {
                url: itemUrl,
                title: 'תוצאת שאילתה',
                urlType: 'portal',
            },
        ];
    }

    // Try download URL
    const downloadUrl = getString(output, 'download_url');
    if (downloadUrl) {
        return [
            {
                url: downloadUrl,
                title: 'הורדת תוצאות השאילתה',
                urlType: 'api',
            },
        ];
    }

    // Fallback to search
    const dataset = getString(input, 'dataset');
    if (!dataset) return [];
    return [
        {
            url: `${BUDGET_PORTAL_URL}/s?q=${encodeURIComponent(dataset)}`,
            title: `שאילתה: ${dataset}`,
            urlType: 'portal',
        },
    ];
};

export const budgetSourceResolvers: Partial<Record<BudgetToolName, ToolSourceResolver>> = {
    budgetkey_DatasetInfo: resolveDatasetInfo,
    budgetkey_DatasetFullTextSearch: resolveDatasetFullTextSearch,
    budgetkey_DatasetDBQuery: resolveDatasetDBQuery,
};
