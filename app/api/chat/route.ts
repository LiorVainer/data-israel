/**
 * Chat API Route
 *
 * Streaming endpoint using Mastra agent network
 */

import { handleNetworkStream } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import { mastra } from '@/agents/mastra';

/**
 * POST /api/chat
 *
 * Handles chat messages and streams agent responses via the routing agent.
 */
export const maxDuration = 120;

export async function POST(req: Request) {
    const params = await req.json();

    const stream = await handleNetworkStream({
        mastra,
        agentId: 'routingAgent',
        params,
    });

    return createUIMessageStreamResponse({ stream });
}
