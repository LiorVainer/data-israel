/**
 * Data Source Registry — Server-only Agent References
 *
 * Contains agent factory references that depend on @mastra/core/agent.
 * Must NOT be imported by client components — only by server-side code
 * (mastra.ts, routing.agent.ts, API routes).
 */

import { CbsDataSource } from './cbs';
import { DataGovDataSource } from './datagov';
import { BudgetDataSource } from './budget';
import { NadlanDataSource } from './nadlan';
import { DrugsDataSource } from './drugs';
import { HealthDataSource } from './health';
import { GroceryDataSource } from './grocery';
import { KnessetDataSource } from './knesset';

/**
 * Agent references for Mastra registration — keyed by agent ID.
 * Each entry provides the agent factory and metadata needed to
 * create Mastra Agent instances at runtime.
 *
 * Note: Some agent factories (e.g., BudgetKey MCP) return Promise<Agent>.
 * Callers must handle both sync and async results.
 */
export const dataSourceAgents = {
    [CbsDataSource.agent.id]: CbsDataSource.agent,
    [DataGovDataSource.agent.id]: DataGovDataSource.agent,
    [BudgetDataSource.agent.id]: BudgetDataSource.agent,
    [NadlanDataSource.agent.id]: NadlanDataSource.agent,
    [DrugsDataSource.agent.id]: DrugsDataSource.agent,
    [HealthDataSource.agent.id]: HealthDataSource.agent,
    [GroceryDataSource.agent.id]: GroceryDataSource.agent,
    [KnessetDataSource.agent.id]: KnessetDataSource.agent,
} as const;
