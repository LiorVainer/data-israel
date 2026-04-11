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
import { AGENT_ID_TO_SOURCE_ID, type DataSource } from '@/data-sources/registry';
import { MASTRA_SCORERS } from './evals/eval.config';
import { getOrCreateAgent } from '@/lib/cache/agent-cache';
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

/**
 * Creates (or returns cached) Mastra instance with the specified per-agent models.
 * Model IDs should be OpenRouter format (e.g., 'google/gemini-3-flash-preview').
 * The function prefixes them with 'openrouter/' for Mastra's model format.
 *
 * Sub-agents are cached individually by (agentId, modelId) via LRU cache,
 * so partial config or enabledSources changes only recreate affected agents.
 * The Mastra instance itself is cheap to construct and always created fresh.
 */
export async function getMastraWithModels(config: AgentModelConfig, enabledSources?: DataSource[]): Promise<Mastra> {
    // Filter data source agents when enabledSources is provided
    const filteredAgentEntries = Object.entries(dataSourceAgents).filter(([agentId]) => {
        if (!enabledSources?.length) return true;
        const dsId = AGENT_ID_TO_SOURCE_ID.get(agentId);
        return dsId !== undefined && enabledSources.includes(dsId);
    });

    // Build sub-agents from registry with per-source model overrides.
    // Each agent is individually cached by (agentId, modelId) — cache hits skip creation.
    const subAgentEntries = await Promise.all(
        filteredAgentEntries.map(async ([agentId, agentDef]) => {
            const dsId = AGENT_ID_TO_SOURCE_ID.get(agentId) ?? (agentId.replace('Agent', '') as DataSource);
            const modelId = `openrouter/${config[dsId] ?? config.routing}`;
            const agent = await getOrCreateAgent(agentId, modelId, agentDef.createAgent);
            return [agentId, agent] as const;
        }),
    );
    const subAgents: Record<string, Agent> = Object.fromEntries(subAgentEntries);

    const newRouting = createRoutingAgent(`openrouter/${config.routing}`, subAgents);

    return new Mastra({
        agents: { routingAgent: newRouting, ...subAgents },
        ...(storage && { storage }),
        ...(observability && { observability }),
        scorers: MASTRA_SCORERS,
    });
}
