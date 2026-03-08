/**
 * Read the current agent instruction prompt by agent ID.
 *
 * Maps agent IDs to their config objects so the optimizer
 * can retrieve the current system prompt for revision.
 */

import { ROUTING_CONFIG } from '../../network/routing/config';
import { DATAGOV_AGENT_CONFIG } from '../../network/datagov/config';
import { CBS_AGENT_CONFIG } from '../../network/cbs/config';

const AGENT_CONFIGS: Record<string, { instructions: string }> = {
    routingAgent: ROUTING_CONFIG,
    datagovAgent: DATAGOV_AGENT_CONFIG,
    cbsAgent: CBS_AGENT_CONFIG,
};

export function getAgentPrompt(agentId: string): string {
    const config = AGENT_CONFIGS[agentId];
    if (!config) {
        throw new Error(`Unknown agent: ${agentId}. Valid: ${Object.keys(AGENT_CONFIGS).join(', ')}`);
    }
    return config.instructions;
}
