/**
 * Chat API Route
 *
 * Streaming endpoint using Mastra agent network
 */

import { createUIMessageStreamResponse, StopCondition } from 'ai';
import { NextResponse } from 'next/server';
import { mastra } from '@/agents/mastra';
import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';

/**
 * POST /api/chat
 *
 * Handles chat messages and streams agent responses via the routing agent.
 */
export const maxDuration = 120;
const MAX_STEPS = 10;

const hasLastPartAsTextPart: StopCondition<any> = ({ steps }) => {
    const stepsAmount = steps.length;
    if (stepsAmount > MAX_STEPS) return true;

    const lastStep = steps[steps.length - 1];
    return !!lastStep?.text && !lastStep?.toolCalls?.length;
};

/**
 * GET /api/chat?threadId=...&resourceId=...
 *
 * Retrieves stored chat messages from Mastra memory for hydrating the UI on page load.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    const resourceId = searchParams.get('resourceId');

    if (!threadId) {
        return NextResponse.json([]);
    }

    const memory = await mastra.getAgentById('routingAgent').getMemory();
    let response = null;

    try {
        response = await memory?.recall({
            threadId,
            resourceId: resourceId || 'default-user',
        });
    } catch {
        console.log('No previous messages found.');
    }

    const uiMessages = toAISdkV5Messages(response?.messages || []);
    return NextResponse.json(uiMessages);
}

export async function POST(req: Request) {
    const params = await req.json();

    console.log('[Chat API] Received request with params:', params);

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
