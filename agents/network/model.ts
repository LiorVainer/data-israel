/**
 * Shared model ID factory for Mastra agents.
 *
 * Mastra uses "openrouter/{provider}/{model}" string format natively.
 * Requires OPENROUTER_API_KEY env var.
 */

import { AgentConfig } from '../agent.config';

export const getMastraModelId = (): string => {
    return `openrouter/${AgentConfig.MODEL.DEFAULT_ID}`;
};

export const getAiSdkModelId = (): string => {
    return AgentConfig.MODEL.DEFAULT_ID;
};
