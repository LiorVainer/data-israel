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
import { ROUTING_CONFIG } from './config';
import {
    browseCbsPriceIndices,
    calculateCbsPriceIndex,
    displayBarChart,
    displayLineChart,
    displayPieChart,
    getCbsPriceData,
    searchCbsLocalities,
} from '@/lib/tools';
import { DataGovTools } from '@/lib/tools/datagov';

export const routingAgent = new Agent({
    id: 'routingAgent',
    name: ROUTING_CONFIG.name,
    instructions: ROUTING_CONFIG.instructions,
    model: getModelId(),
    memory: new Memory({
        storage: new LibSQLStore({
            id: 'mastra-storage',
            url: ':memory:',
        }),
    }),
    tools: {
        displayBarChart,
        displayLineChart,
        displayPieChart,
        browseCbsPriceIndices,
        getCbsPriceData,
        calculateCbsPriceIndex,
        searchCbsLocalities,
        DataGovTools,
    },
});
