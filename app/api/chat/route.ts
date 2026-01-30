/**
 * Chat API Route
 *
 * Streaming endpoint using Mastra agent network
 */

import { handleChatStream } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import { mastra } from '@/agents/mastra';

/**
 * POST /api/chat
 *
 * Handles chat messages and streams agent responses via the routing agent.
 */
export const maxDuration = 60;

export async function POST(req: Request) {
    const params = await req.json();

    const stream = await handleChatStream({
        mastra,
        agentId: 'routing-agent',
        params,
    });

    return createUIMessageStreamResponse({ stream });
}
