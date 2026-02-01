/**
 * Chat API Route
 *
 * Streaming endpoint using Mastra agent network
 */

import { createUIMessageStreamResponse, StopCondition } from 'ai';
import { mastra } from '@/agents/mastra';
import { handleChatStream } from '@mastra/ai-sdk';

/**
 * POST /api/chat
 *
 * Handles chat messages and streams agent responses via the routing agent.
 */
export const maxDuration = 120;

const hasLastPartAsTextPart: StopCondition<any> = ({ steps }) => {
    const lastStep = steps[steps.length - 1];
    return !!lastStep?.text && !lastStep?.toolCalls?.length;
};

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
            stopWhen: hasLastPartAsTextPart,
        },
    });

    return createUIMessageStreamResponse({ stream });
}
