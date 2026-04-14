/**
 * Dynamic Model Resolution
 *
 * Resolves per-agent model configuration by querying Convex ai_models table
 * at runtime, with fallback to environment variable defaults.
 *
 * Resolution order: Convex ai_models → per-agent env var → AI_DEFAULT_MODEL_ID
 */

import { convexClient } from '@/lib/convex/client';
import { api } from '@/convex/_generated/api';
import type { AgentModelConfig } from '@/agents/mastra';
import { AgentConfig } from '@/agents/agent.config';
import { AGENT_ID_TO_SOURCE_ID, type DataSource } from '@/data-sources/registry';

/** Env-var defaults keyed by DataSource ID */
const ENV_DEFAULTS: Record<DataSource, string> = {
    datagov: AgentConfig.MODEL.DATAGOV_ID,
    cbs: AgentConfig.MODEL.CBS_ID,
    budget: AgentConfig.MODEL.BUDGET_ID,
    govmap: AgentConfig.MODEL.GOVMAP_ID,
    health: AgentConfig.MODEL.HEALTH_ID,
    knesset: AgentConfig.MODEL.KNESSET_ID,
    shufersal: AgentConfig.MODEL.SHUFERSAL_ID,
    'rami-levy': AgentConfig.MODEL.RAMI_LEVY_ID,
};

/**
 * Resolves per-agent model configuration from Convex runtime overrides
 * with fallback to env var defaults.
 *
 * Resolution order: Convex ai_models → per-agent env var → AI_DEFAULT_MODEL_ID
 */
export async function resolveModelConfig(): Promise<AgentModelConfig> {
    // Build defaults from env vars
    const defaults: AgentModelConfig = {
        routing: AgentConfig.MODEL.DEFAULT_ID,
        ...ENV_DEFAULTS,
    };

    try {
        const records = await convexClient.query(api.aiModels.getAll, {});

        const config = { ...defaults };
        for (const record of records) {
            if (record.agentId === 'routing') {
                config.routing = record.modelId;
            } else {
                // Map registry agent IDs (e.g., 'cbsAgent') to DataSource IDs (e.g., 'cbs')
                const dsId = AGENT_ID_TO_SOURCE_ID.get(record.agentId);
                if (dsId) {
                    config[dsId] = record.modelId;
                }
            }
        }
        return config;
    } catch (error: unknown) {
        console.warn(
            '[resolveModelConfig] Convex query failed, using env defaults:',
            error instanceof Error ? error.message : String(error),
        );
        return defaults;
    }
}
