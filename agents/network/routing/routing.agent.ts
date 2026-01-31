/**
 * Routing Agent (Orchestrator)
 *
 * Routes user queries to specialized sub-agents based on intent.
 * Memory is required for Mastra agent network execution.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { getModelId } from '../model';
import { datagovAgent } from '../datagov';
import { cbsAgent } from '../cbs';
import { visualizationAgent } from '../visualization';
import { ROUTING_CONFIG } from './config';

export const routingAgent = new Agent({
    id: 'routingAgent',
    name: ROUTING_CONFIG.name,
    instructions: ROUTING_CONFIG.instructions,
    model: getModelId(),
    agents: { datagovAgent, cbsAgent, visualizationAgent },
    memory: new Memory({
        storage: new LibSQLStore({
            id: 'mastra-storage',
            url: ':memory:',
        }),
    }),
});
