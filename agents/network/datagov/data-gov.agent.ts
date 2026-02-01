/**
 * DataGov Search Agent
 *
 * Searches and explores Israeli open datasets from data.gov.il
 */

import { Agent } from '@mastra/core/agent';
import { getModelId } from '../model';
import { DATAGOV_AGENT_CONFIG } from './config';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { DataGovTools } from '@/lib/tools/datagov';

export const datagovAgent = new Agent({
    id: 'datagovAgent',
    name: DATAGOV_AGENT_CONFIG.name,
    description:
        'Searches and explores Israeli open datasets from data.gov.il — datasets, organizations, groups, tags, resources, and DataStore queries.',
    instructions: DATAGOV_AGENT_CONFIG.instructions,
    model: getModelId(),
    tools: DataGovTools,
    memory: new Memory({
        storage: new LibSQLStore({
            id: 'mastra-storage',
            url: ':memory:',
        }),
    }),
});
