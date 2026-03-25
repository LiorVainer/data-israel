/**
 * BudgetKey MCP Client
 *
 * Connects to the BudgetKey hosted MCP endpoint for Israeli state budget data.
 * Tools are auto-discovered via MCPClient.listTools() and namespaced as
 * `budgetkey_<ToolName>`.
 */

import { MCPClient } from '@mastra/mcp';

export const budgetMcpClient = new MCPClient({
    id: 'budgetkey-mcp',
    servers: {
        budgetkey: {
            url: new URL('https://next.obudget.org/mcp'),
        },
    },
    timeout: 60_000,
});
