/**
 * BudgetKey Tool Types & Static Registry
 *
 * Type definitions and static tool name records for BudgetKey MCP tools.
 * The actual tool implementations are loaded dynamically from the MCP server
 * at agent creation time, but we define known tool names here for:
 * - Type-safe translations and source resolver keys
 * - Client-side tool-to-datasource mapping in the registry
 *
 * Tools are namespaced by MCPClient as `budgetkey_<ToolName>`.
 */

/** Known BudgetKey MCP tool names (server name prefix + tool name) */
export type BudgetToolName = 'budgetkey_DatasetInfo' | 'budgetkey_DatasetFullTextSearch' | 'budgetkey_DatasetDBQuery';

/** Array of known tool names for runtime checks */
export const BUDGET_TOOL_NAMES: readonly BudgetToolName[] = [
    'budgetkey_DatasetInfo',
    'budgetkey_DatasetFullTextSearch',
    'budgetkey_DatasetDBQuery',
] as const;

/**
 * Static tool name record for client-side registry integration.
 * Values are `unknown` because actual Tool objects are loaded from MCP at runtime.
 * This record is used only for key-based lookups (tool-to-datasource mapping,
 * translation key validation, source resolver key validation).
 */
export const BudgetToolNames: Record<BudgetToolName, unknown> = {
    budgetkey_DatasetInfo: true,
    budgetkey_DatasetFullTextSearch: true,
    budgetkey_DatasetDBQuery: true,
};
