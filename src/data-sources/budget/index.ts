/**
 * BudgetKey Data Source Definition
 *
 * Self-contained module for the Israeli state budget data source (BudgetKey/OpenBudget).
 * Uses Mastra MCPClient to connect to the hosted MCP endpoint at https://next.obudget.org/mcp.
 *
 * Unlike CBS/DataGov, tools are loaded dynamically from the MCP server at agent creation time.
 * The static `tools` record contains placeholder entries for client-side registry integration
 * (tool-to-datasource mapping, translation keys, source resolver keys).
 */

import type { ToolSourceResolver, ToolTranslation } from '@/data-sources/types';
import { BudgetToolNames, type BudgetToolName } from './budget.tools';
import {
    createBudgetAgent,
    BUDGET_AGENT_NAME,
    BUDGET_AGENT_DESCRIPTION,
    BUDGET_AGENT_INSTRUCTIONS,
} from './budget.agent';
import { budgetDisplayLabel, budgetDisplayIcon, budgetBadgeConfig } from './budget.display';
import { budgetTranslations } from './budget.translations';
import { budgetSourceResolvers } from './budget.source-resolvers';

/**
 * BudgetKey data source definition.
 *
 * Note: Does not use `satisfies DataSourceDefinition<...>` because the tools record
 * contains placeholder values (actual Tool objects are loaded from MCP at runtime).
 * Type safety for translation/resolver keys is enforced by the BudgetToolName type.
 */
export const BudgetDataSource = {
    id: 'budget',

    agent: {
        id: 'budgetAgent',
        name: BUDGET_AGENT_NAME,
        description: BUDGET_AGENT_DESCRIPTION,
        instructions: BUDGET_AGENT_INSTRUCTIONS,
        createAgent: createBudgetAgent,
    },

    display: {
        label: budgetDisplayLabel,
        icon: budgetDisplayIcon,
        badge: budgetBadgeConfig,
    },

    landing: {
        category: 'economy' as const,
        order: 1,
    },

    routingHint:
        'נתוני תקציב המדינה של ישראל מפרויקט מפתח התקציב — ספר התקציב (הוצאות מתוכננות ומבוצעות 1997-2025), תוכניות תמיכה תקציביות, התקשרויות רכש ממשלתיות, מכרזים, ישויות (חברות, עמותות, רשויות), הכנסות המדינה, ובקשות לשינויי תקציב.',

    tools: BudgetToolNames,
    sourceResolvers: budgetSourceResolvers as Partial<Record<BudgetToolName, ToolSourceResolver>>,
    translations: budgetTranslations as Partial<Record<BudgetToolName, ToolTranslation>>,

    /** Extract resource identifiers from tool arguments for source URL resolution */
    resourceExtractors: {
        budgetkey_DatasetInfo: (args: Record<string, unknown>) => ({
            dataset: typeof args.dataset === 'string' ? args.dataset : undefined,
        }),
        budgetkey_DatasetFullTextSearch: (args: Record<string, unknown>) => ({
            dataset: typeof args.dataset === 'string' ? args.dataset : undefined,
            q: typeof args.q === 'string' ? args.q : undefined,
        }),
        budgetkey_DatasetDBQuery: (args: Record<string, unknown>) => ({
            dataset: typeof args.dataset === 'string' ? args.dataset : undefined,
        }),
    },
};

// Re-export tools and types for convenience
export { type BudgetToolName, BudgetToolNames, BUDGET_TOOL_NAMES } from './budget.tools';
export { createBudgetAgent } from './budget.agent';
export { budgetTranslations } from './budget.translations';
export { budgetDisplayLabel, budgetDisplayIcon, budgetBadgeConfig } from './budget.display';
export { budgetSourceResolvers } from './budget.source-resolvers';
