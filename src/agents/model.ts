/**
 * Shared model ID factory for Mastra agents.
 *
 * Mastra uses "openrouter/{provider}/{model}" string format natively.
 * Requires OPENROUTER_API_KEY env var.
 */

import { AgentConfig } from './agent.config';

export type SubAgentId = 'datagov' | 'cbs' | 'budget' | 'govmap' | 'health' | 'knesset' | 'shufersal' | 'rami-levy';

const getModelIdForAgent = (agentId?: SubAgentId): string => {
    if (!agentId) return AgentConfig.MODEL.DEFAULT_ID;

    switch (agentId) {
        case 'datagov':
            return AgentConfig.MODEL.DATAGOV_ID;
        case 'cbs':
            return AgentConfig.MODEL.CBS_ID;
        case 'budget':
            return AgentConfig.MODEL.BUDGET_ID;
        case 'govmap':
            return AgentConfig.MODEL.GOVMAP_ID;
        case 'health':
            return AgentConfig.MODEL.HEALTH_ID;
        case 'knesset':
            return AgentConfig.MODEL.KNESSET_ID;
        case 'shufersal':
            return AgentConfig.MODEL.SHUFERSAL_ID;
        case 'rami-levy':
            return AgentConfig.MODEL.RAMI_LEVY_ID;
    }
};

export const getMastraModelId = (agentId?: SubAgentId): string => {
    return `openrouter/${getModelIdForAgent(agentId)}`;
};

export const getAiSdkModelId = (agentId?: SubAgentId): string => {
    return getModelIdForAgent(agentId);
};
