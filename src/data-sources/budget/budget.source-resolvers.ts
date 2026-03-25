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

/** Resolver for DatasetInfo — links to the portal search page */
const resolveDatasetInfo: ToolSourceResolver = (input, _output) => {
    const dataset = getString(input, 'dataset');
    if (!dataset) return null;
    return {
        url: `${BUDGET_PORTAL_URL}/s?q=${encodeURIComponent(dataset)}&dd=budgets`,
        title: `מאגר: ${dataset}`,
        urlType: 'portal',
    };
};

/** Resolver for DatasetFullTextSearch — links to the portal search page */
const resolveDatasetFullTextSearch: ToolSourceResolver = (input, _output) => {
    const q = getString(input, 'q');
    const dataset = getString(input, 'dataset');
    if (!q && !dataset) return null;
    const searchTerm = q ?? dataset ?? '';
    return {
        url: `${BUDGET_PORTAL_URL}/s?q=${encodeURIComponent(searchTerm)}&dd=budgets`,
        title: q ? `חיפוש: ${q}` : `מאגר: ${dataset}`,
        urlType: 'portal',
    };
};

/** Resolver for DatasetDBQuery — links to portal or uses download_url if available */
const resolveDatasetDBQuery: ToolSourceResolver = (input, output) => {
    const downloadUrl = getString(output, 'download_url');
    if (downloadUrl) {
        return {
            url: downloadUrl,
            title: 'הורדת תוצאות השאילתה',
            urlType: 'api',
        };
    }
    const dataset = getString(input, 'dataset');
    if (!dataset) return null;
    return {
        url: `${BUDGET_PORTAL_URL}/s?q=${encodeURIComponent(dataset)}&dd=budgets`,
        title: `שאילתה: ${dataset}`,
        urlType: 'portal',
    };
};

export const budgetSourceResolvers: Partial<Record<BudgetToolName, ToolSourceResolver>> = {
    budgetkey_DatasetInfo: resolveDatasetInfo,
    budgetkey_DatasetFullTextSearch: resolveDatasetFullTextSearch,
    budgetkey_DatasetDBQuery: resolveDatasetDBQuery,
};
