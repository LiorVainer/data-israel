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

/** Valid agent IDs that can be overridden via the ai_models table */
const AGENT_IDS = ['routing', 'datagov', 'cbs'] as const;
type AgentId = (typeof AGENT_IDS)[number];

function isAgentId(value: string): value is AgentId {
    return (AGENT_IDS as readonly string[]).includes(value);
}

/**
 * Resolves per-agent model configuration from Convex runtime overrides
 * with fallback to env var defaults.
 *
 * Resolution order: Convex ai_models → per-agent env var → AI_DEFAULT_MODEL_ID
 */
export async function resolveModelConfig(): Promise<AgentModelConfig> {
    const defaults: AgentModelConfig = {
        routing: AgentConfig.MODEL.DEFAULT_ID,
        datagov: AgentConfig.MODEL.DATAGOV_ID,
        cbs: AgentConfig.MODEL.CBS_ID,
    };

    try {
        const records = await convexClient.query(api.aiModels.getAll, {});

        const config = { ...defaults };
        for (const record of records) {
            if (isAgentId(record.agentId)) {
                config[record.agentId] = record.modelId;
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
