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

/** Map BudgetKey dataset IDs to portal search category (`dd` param) and Hebrew labels */
const DATASET_TO_PORTAL: Record<string, { dd: string; label: string }> = {
    budget_items_data: { dd: 'budgets', label: 'ספר התקציב' },
    support_programs_data: { dd: 'supports', label: 'תוכניות תמיכה' },
    supports_transactions_data: { dd: 'supports', label: 'תשלומי תמיכות' },
    contracts_data: { dd: 'contract-spending', label: 'התקשרויות רכש' },
    entities_data: { dd: 'entities', label: 'גופים וארגונים' },
    income_items_data: { dd: 'budgets', label: 'הכנסות המדינה' },
    budgetary_change_requests_data: { dd: 'national-budget-changes', label: 'שינויי תקציב' },
    budgetary_change_transactions_data: { dd: 'national-budget-changes', label: 'העברות תקציביות' },
};

function getPortalCategory(dataset: string | undefined): { dd: string; label: string } {
    if (!dataset) return { dd: 'all', label: 'תקציב המדינה' };
    return DATASET_TO_PORTAL[dataset] ?? { dd: 'all', label: dataset };
}

/** Resolver for DatasetInfo — links to the portal with correct category */
const resolveDatasetInfo: ToolSourceResolver = (input, _output) => {
    const dataset = getString(input, 'dataset');
    if (!dataset) return null;
    const { dd, label } = getPortalCategory(dataset);
    return {
        url: `${BUDGET_PORTAL_URL}/s?dd=${dd}`,
        title: `מאגר: ${label}`,
        urlType: 'portal',
    };
};

/** Resolver for DatasetFullTextSearch — links to portal search with user's query */
const resolveDatasetFullTextSearch: ToolSourceResolver = (input, _output) => {
    const q = getString(input, 'q');
    const dataset = getString(input, 'dataset');
    if (!q && !dataset) return null;
    const { dd } = getPortalCategory(dataset);
    if (q) {
        return {
            url: `${BUDGET_PORTAL_URL}/s?q=${encodeURIComponent(q)}&dd=${dd}`,
            title: `חיפוש: ${q}`,
            urlType: 'portal',
        };
    }
    const { label } = getPortalCategory(dataset);
    return {
        url: `${BUDGET_PORTAL_URL}/s?dd=${dd}`,
        title: `מאגר: ${label}`,
        urlType: 'portal',
    };
};

/** Resolver for DatasetDBQuery — links to portal with correct category, or download_url if available */
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
    const q = getString(input, 'q');
    const { dd, label } = getPortalCategory(dataset);
    return {
        url: q ? `${BUDGET_PORTAL_URL}/s?q=${encodeURIComponent(q)}&dd=${dd}` : `${BUDGET_PORTAL_URL}/s?dd=${dd}`,
        title: `שאילתה: ${label}`,
        urlType: 'portal',
    };
};

export const budgetSourceResolvers: Partial<Record<BudgetToolName, ToolSourceResolver>> = {
    budgetkey_DatasetInfo: resolveDatasetInfo,
    budgetkey_DatasetFullTextSearch: resolveDatasetFullTextSearch,
    budgetkey_DatasetDBQuery: resolveDatasetDBQuery,
};
