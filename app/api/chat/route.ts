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
export const maxDuration = 120;

export async function POST(req: Request) {
    const params = await req.json();

    const stream = await handleChatStream({
        mastra,
        agentId: 'routingAgent',
        params,
        defaultOptions: {
            toolCallConcurrency: 10,
            onFinish: async ({ usage }) => {
                // Limit total execution time to avoid long-running requests
                console.log({ usage });
            },
        },
    });

    return createUIMessageStreamResponse({ stream });
}
