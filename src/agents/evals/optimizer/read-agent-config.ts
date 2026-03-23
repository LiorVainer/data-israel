/**
 * Read the current agent instruction prompt by agent ID.
 *
 * Maps agent IDs to their config objects so the optimizer
 * can retrieve the current system prompt for revision.
 */

import { ROUTING_CONFIG } from '../../routing/config';
import { DATAGOV_AGENT_INSTRUCTIONS } from '@/data-sources/datagov/datagov.agent';
import { CBS_AGENT_INSTRUCTIONS } from '@/data-sources/cbs/cbs.agent';

const AGENT_CONFIGS: Record<string, { instructions: string }> = {
    routingAgent: ROUTING_CONFIG,
    datagovAgent: { instructions: DATAGOV_AGENT_INSTRUCTIONS },
    cbsAgent: { instructions: CBS_AGENT_INSTRUCTIONS },
};

export function getAgentPrompt(agentId: string): string {
    const config = AGENT_CONFIGS[agentId];
    if (!config) {
        throw new Error(`Unknown agent: ${agentId}. Valid: ${Object.keys(AGENT_CONFIGS).join(', ')}`);
    }
    return config.instructions;
}
