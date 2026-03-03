/**
 * DataGov Search Agent
 *
 * Searches and explores Israeli open datasets from data.gov.il
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { getMastraModelId } from '../model';
import { DATAGOV_AGENT_CONFIG } from './config';
import { AgentConfig } from '../../agent.config';
import { DataGovTools } from '@/lib/tools/datagov';

const { MEMORY } = AgentConfig;

/** Factory: creates a DataGov agent with the given Mastra model ID */
export function createDatagovAgent(modelId: string): Agent {
    return new Agent({
        id: 'datagovAgent',
        name: DATAGOV_AGENT_CONFIG.name,
        description:
            'Searches and explores Israeli open datasets from data.gov.il — datasets, organizations, groups, tags, resources, and DataStore queries.',
        instructions: DATAGOV_AGENT_CONFIG.instructions,
        model: modelId,
        tools: DataGovTools,
        memory: new Memory({
            options: {
                lastMessages: MEMORY.LAST_MESSAGES,
            },
        }),
    });
}

/** Static default instance (backward compat) */
export const datagovAgent = createDatagovAgent(getMastraModelId('datagov'));
