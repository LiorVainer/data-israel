/**
 * Shared model ID factory for Mastra agents.
 *
 * Mastra uses "openrouter/{provider}/{model}" string format natively.
 * Requires OPENROUTER_API_KEY env var.
 */

import { AgentConfig } from '../agent.config';

export type SubAgentId = 'datagov' | 'cbs';

const getModelIdForAgent = (agentId?: SubAgentId): string => {
    if (!agentId) return AgentConfig.MODEL.DEFAULT_ID;

    switch (agentId) {
        case 'datagov':
            return AgentConfig.MODEL.DATAGOV_ID;
        case 'cbs':
            return AgentConfig.MODEL.CBS_ID;
    }
};

export const getMastraModelId = (agentId?: SubAgentId): string => {
    return `openrouter/${getModelIdForAgent(agentId)}`;
};

export const getAiSdkModelId = (agentId?: SubAgentId): string => {
    return getModelIdForAgent(agentId);
};
