/**
 * Routing Agent (Orchestrator)
 *
 * Routes user queries to specialized sub-agents based on intent.
 * Memory is required for Mastra agent network execution.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { getMastraModelId } from '../model';
import { ROUTING_CONFIG } from './config';
import { ClientTools } from '@/lib/tools/client';
import { DataGovTools } from '@/lib/tools/datagov';
import { CbsTools } from '@/lib/tools/cbs';

export const routingAgent = new Agent({
    id: 'routingAgent',
    name: ROUTING_CONFIG.name,
    instructions: ROUTING_CONFIG.instructions,
    // agents: {
    //     cbsAgent,
    //     datagovAgent,
    // },
    model: getMastraModelId(),
    memory: new Memory({
        storage: new LibSQLStore({
            id: 'mastra-storage',
            url: ':memory:',
        }),
    }),
    tools: {
        ...ClientTools,
        ...CbsTools,
        ...DataGovTools,
    },
});
