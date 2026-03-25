/**
 * Mastra Instance
 *
 * Central entry point registering all agents for the API route.
 * Uses ConvexStore as instance-level storage — all agents inherit it automatically.
 * Sentry observability is configured to trace agent runs, LLM calls, and tool executions.
 */

import { Mastra } from '@mastra/core';
import type { Agent } from '@mastra/core/agent';
import { ConvexStore } from '@mastra/convex';
import { Observability, SamplingStrategyType } from '@mastra/observability';
import { SentryExporter } from '@mastra/sentry';
import { routingAgent, createRoutingAgent } from './routing/routing.agent';
import { createCbsAgent } from '@/data-sources/cbs';
import { createDatagovAgent } from '@/data-sources/datagov';
import { dataSourceAgents } from '@/data-sources/registry.server';
import type { DataSourceId } from '@/data-sources/registry';
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

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

const observability = sentryDsn
    ? new Observability({
          configs: {
              sentry: {
                  serviceName: 'data-israel',
                  sampling: {
                      type: SamplingStrategyType.ALWAYS,
                  },
                  exporters: [
                      new SentryExporter({
                          dsn: sentryDsn,
                          environment: ENV.NODE_ENV,
                          tracesSampleRate: 0.1,
                      }),
                  ],
              },
          },
      })
    : undefined;

/** Static default agents (backward compat) — explicit keys for AgentName derivation.
 *  Uses direct sync imports (not registry) because registry.createAgent may be async for MCP sources. */
export const agents = {
    routingAgent,
    cbsAgent: createCbsAgent(`openrouter/${ENV.AI_DEFAULT_MODEL_ID}`),
    datagovAgent: createDatagovAgent(`openrouter/${ENV.AI_DEFAULT_MODEL_ID}`),
};

export const mastra = new Mastra({
    agents,
    ...(storage && { storage }),
    ...(observability && { observability }),
    scorers: MASTRA_SCORERS,
});

/** Per-agent model configuration (all values are OpenRouter model IDs like 'google/gemini-3-flash-preview') */
export interface AgentModelConfig {
    routing: string;
    [key: string]: string;
}

// Cache: single entry (last config -> last Mastra instance)
let cachedConfigKey: string | null = null;
let cachedMastra: Mastra | null = null;

/**
 * Creates (or returns cached) Mastra instance with the specified per-agent models.
 * Model IDs should be OpenRouter format (e.g., 'google/gemini-3-flash-preview').
 * The function prefixes them with 'openrouter/' for Mastra's model format.
 *
 * Async because some data sources (e.g., BudgetKey MCP) require async tool loading.
 */
export async function getMastraWithModels(config: AgentModelConfig): Promise<Mastra> {
    const configKey = JSON.stringify(config);

    if (cachedConfigKey === configKey && cachedMastra) {
        return cachedMastra;
    }

    console.log({ config });

    // Build sub-agents from registry with per-source model overrides
    // Some agent factories are async (MCP-based sources), so we await all of them
    const subAgentEntries = await Promise.all(
        Object.entries(dataSourceAgents).map(async ([agentId, agentDef]) => {
            const dsId = agentId.replace('Agent', '') as DataSourceId;
            const modelId = config[dsId] ?? config.routing;
            const agent = await agentDef.createAgent(`openrouter/${modelId}`);
            return [agentId, agent] as const;
        }),
    );
    const subAgents: Record<string, Agent> = Object.fromEntries(subAgentEntries);

    const newRouting = createRoutingAgent(`openrouter/${config.routing}`, subAgents);

    const newMastra = new Mastra({
        agents: { routingAgent: newRouting, ...subAgents },
        ...(storage && { storage }),
        ...(observability && { observability }),
        scorers: MASTRA_SCORERS,
    });

    cachedConfigKey = configKey;
    cachedMastra = newMastra;

    return newMastra;
}
