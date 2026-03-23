/**
 * Data Source Registry — Server-only Agent References
 *
 * Contains agent factory references that depend on @mastra/core/agent.
 * Must NOT be imported by client components — only by server-side code
 * (mastra.ts, routing.agent.ts, API routes).
 */

import { CbsDataSource } from './cbs';
import { DataGovDataSource } from './datagov';

/**
 * Agent references for Mastra registration — keyed by agent ID.
 * Each entry provides the agent factory and metadata needed to
 * create Mastra Agent instances at runtime.
 */
export const dataSourceAgents = {
    [CbsDataSource.agent.id]: CbsDataSource.agent,
    [DataGovDataSource.agent.id]: DataGovDataSource.agent,
} as const;
