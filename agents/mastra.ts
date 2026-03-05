/**
 * Mastra Instance
 *
 * Central entry point registering all agents for the API route.
 * Uses ConvexStore as instance-level storage — all agents inherit it automatically.
 */

import { Mastra } from '@mastra/core';
import { ConvexStore } from '@mastra/convex';
import { cbsAgent, datagovAgent, routingAgent } from './network';
import { createRoutingAgent } from './network/routing/routing.agent';
import { createDatagovAgent } from './network/datagov/data-gov.agent';
import { createCbsAgent } from './network/cbs/cbs.agent';
import { MASTRA_SCORERS } from './evals/eval.config';
import { ENV } from '@/lib/env';

const convexUrl = ENV.NEXT_PUBLIC_CONVEX_URL;
const convexAdminKey = ENV.CONVEX_ADMIN_KEY;

const storage =
    convexUrl && convexAdminKey
        ? new ConvexStore({
              id: 'convex-storage',
              deploymentUrl: convexUrl,
              adminAuthToken: convexAdminKey,
          })
        : undefined;

/** Static default agents (backward compat) */
export const agents = { routingAgent, cbsAgent, datagovAgent };

export const mastra = new Mastra({
    agents,
    ...(storage && { storage }),
    scorers: MASTRA_SCORERS,
});

/** Per-agent model configuration (all values are OpenRouter model IDs like 'google/gemini-3-flash-preview') */
export interface AgentModelConfig {
    routing: string;
    datagov: string;
    cbs: string;
}

// Cache: single entry (last config -> last Mastra instance)
let cachedConfigKey: string | null = null;
let cachedMastra: Mastra | null = null;

/**
 * Creates (or returns cached) Mastra instance with the specified per-agent models.
 * Model IDs should be OpenRouter format (e.g., 'google/gemini-3-flash-preview').
 * The function prefixes them with 'openrouter/' for Mastra's model format.
 */
export function getMastraWithModels(config: AgentModelConfig): Mastra {
    const configKey = JSON.stringify(config);

    if (cachedConfigKey === configKey && cachedMastra) {
        return cachedMastra;
    }

    console.log({ config });

    const newDatagov = createDatagovAgent(`openrouter/${config.datagov}`);
    const newCbs = createCbsAgent(`openrouter/${config.cbs}`);
    const newRouting = createRoutingAgent(`openrouter/${config.routing}`, {
        datagovAgent: newDatagov,
        cbsAgent: newCbs,
    });

    const newMastra = new Mastra({
        agents: { routingAgent: newRouting, cbsAgent: newCbs, datagovAgent: newDatagov },
        ...(storage && { storage }),
        scorers: MASTRA_SCORERS,
    });

    cachedConfigKey = configKey;
    cachedMastra = newMastra;

    return newMastra;
}
