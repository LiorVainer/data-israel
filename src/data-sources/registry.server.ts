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
import { GovmapDataSource } from './govmap';

import { HealthDataSource } from './health';
import { KnessetDataSource } from './knesset';
import { ShufersalDataSource } from './shufersal';
import { RamiLevyDataSource } from './rami-levy';

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
    [GovmapDataSource.agent.id]: GovmapDataSource.agent,
    [HealthDataSource.agent.id]: HealthDataSource.agent,
    [KnessetDataSource.agent.id]: KnessetDataSource.agent,
    [ShufersalDataSource.agent.id]: ShufersalDataSource.agent,
    [RamiLevyDataSource.agent.id]: RamiLevyDataSource.agent,
} as const;
