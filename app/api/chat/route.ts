/**
 * Chat API Route
 *
 * Streaming endpoint for the data.gov.il agent
 */

import { createAgentUIStreamResponse } from 'ai';
import { dataAgent } from '@/agents/data-agent';

/**
 * POST /api/chat
 *
 * Handles chat messages and streams agent responses
 */
export async function POST(request: Request) {
  const { messages } = await request.json();

  return createAgentUIStreamResponse({
    agent: dataAgent,
    uiMessages: messages,
  });
}
