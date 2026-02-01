/**
 * CBS Agent
 *
 * Queries Israeli Central Bureau of Statistics — statistical series,
 * price indices, CPI calculations, and locality dictionary.
 */

import { Agent } from '@mastra/core/agent';
import { getModelId } from '../model';
import { CBS_AGENT_CONFIG } from './config';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { CbsTools } from '@/lib/tools/cbs';

export const cbsAgent = new Agent({
    id: 'cbsAgent',
    name: CBS_AGENT_CONFIG.name,
    description:
        'Queries Israeli Central Bureau of Statistics (CBS) — statistical price indices, CPI calculations, and locality dictionary.',
    instructions: CBS_AGENT_CONFIG.instructions,
    model: getModelId(),
    tools: CbsTools,
    memory: new Memory({
        storage: new LibSQLStore({
            id: 'mastra-storage',
            url: ':memory:',
        }),
    }),
});
