/**
 * Chat API Route
 *
 * Streaming endpoint for the data.gov.il agent
 */

import { createAgentUIStreamResponse } from 'ai';
import { createDataAgent } from '@/agents/data-agent';
import { AgentConfig } from '@/agents/agent.config';

/**
 * POST /api/chat
 *
 * Handles chat messages and streams agent responses
 * Accepts optional model parameter for dynamic model selection
 */
export async function POST(request: Request) {
  const { messages, model } = await request.json();

  // Validate model is in available models list, fallback to default
  const validModelIds = AgentConfig.AVAILABLE_MODELS.map(m => m.id);
  const selectedModel = model && validModelIds.includes(model)
    ? model
    : AgentConfig.MODEL.DEFAULT_ID;

  const agent = createDataAgent(selectedModel);

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    sendReasoning: true,
    sendSources: true,
  });
}
