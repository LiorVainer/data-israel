/**
 * Eval Test Helpers
 *
 * Creates agents with in-memory LibSQL storage and dynamically resolved models
 * (same resolution as the chat API route: Convex ai_models → env defaults).
 */

import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { ROUTING_CONFIG } from '../../routing/config';
import { DATAGOV_AGENT_NAME, DATAGOV_AGENT_INSTRUCTIONS } from '@/data-sources/datagov/datagov.agent';
import { CBS_AGENT_NAME, CBS_AGENT_INSTRUCTIONS } from '@/data-sources/cbs/cbs.agent';

const DATAGOV_AGENT_CONFIG = { name: DATAGOV_AGENT_NAME, instructions: DATAGOV_AGENT_INSTRUCTIONS } as const;
const CBS_AGENT_CONFIG = { name: CBS_AGENT_NAME, instructions: CBS_AGENT_INSTRUCTIONS } as const;
import { AgentConfig } from '../../agent.config';
import { ClientTools } from '@/lib/tools/client';
import { DataGovTools } from '@/data-sources/datagov/tools';
import { CbsTools } from '@/data-sources/cbs/tools';
import { MASTRA_SCORERS } from '../eval.config';
import { resolveModelConfig } from '@/app/api/chat/resolve-model-config';
import type { AgentModelConfig } from '../../mastra';

const { MEMORY } = AgentConfig;

/** Eval test timeout — routing agent delegates to sub-agents, needs more time */
export const EVAL_TEST_TIMEOUT = 240_000;

const storage = new LibSQLStore({
    id: 'eval-storage',
    url: ':memory:',
});

function createMemory(): Memory {
    return new Memory({
        storage,
        options: {
            lastMessages: MEMORY.LAST_MESSAGES,
        },
    });
}

function buildAgents(config: AgentModelConfig) {
    const datagovAgent = new Agent({
        id: 'datagovAgent',
        name: DATAGOV_AGENT_CONFIG.name,
        description:
            'Searches and explores Israeli open datasets from data.gov.il — datasets, organizations, groups, tags, resources, and DataStore queries.',
        instructions: DATAGOV_AGENT_CONFIG.instructions,
        model: `openrouter/${config.datagov}`,
        tools: DataGovTools,
        memory: createMemory(),
    });

    const cbsAgent = new Agent({
        id: 'cbsAgent',
        name: CBS_AGENT_CONFIG.name,
        description:
            'Queries Israeli Central Bureau of Statistics (CBS) — statistical price indices, CPI calculations, and locality dictionary.',
        instructions: CBS_AGENT_CONFIG.instructions,
        model: `openrouter/${config.cbs}`,
        tools: CbsTools,
        memory: createMemory(),
    });

    const routingAgent = new Agent({
        id: 'routingAgent',
        name: ROUTING_CONFIG.name,
        instructions: ROUTING_CONFIG.instructions,
        model: `openrouter/${config.routing}`,
        memory: createMemory(),
        agents: { datagovAgent, cbsAgent },
        tools: { ...ClientTools },
    });

    const mastra = new Mastra({
        agents: { routingAgent, cbsAgent, datagovAgent },
        storage,
        scorers: MASTRA_SCORERS,
    });

    return { routingAgent, datagovAgent, cbsAgent, mastra };
}

/** Cached result of dynamic model resolution + agent creation */
let cached: ReturnType<typeof buildAgents> | null = null;

/**
 * Resolves models dynamically (Convex ai_models → env defaults) and builds
 * eval agents with in-memory LibSQL storage. Result is cached after first call.
 */
export async function getEvalAgents() {
    if (cached) return cached;

    const config = await resolveModelConfig();
    console.log('[eval-helpers] Resolved model config:', config);

    cached = buildAgents(config);
    return cached;
}
