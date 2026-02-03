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
export const dynamic = 'force-dynamic';
const MAX_STEPS = 10;

// Log environment variable availability (not values) for debugging
const envCheck = {
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL,
    hasConvexAdminKey: !!process.env.CONVEX_ADMIN_KEY,
};
console.log('[Chat API] Environment check:', envCheck);

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
    try {
        const params = await req.json();

        console.log('[Chat API] Received request with params:', JSON.stringify(params, null, 2));

        // Validate required environment variables
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('[Chat API] Missing OPENROUTER_API_KEY');
            return NextResponse.json(
                { error: 'Server configuration error: Missing API key' },
                { status: 500 }
            );
        }

        const stream = await handleChatStream({
            mastra,
            agentId: 'routingAgent',
            params,
            defaultOptions: {
                toolCallConcurrency: 10,
                onFinish: async ({ usage }) => {
                    console.log('[Chat API] Finished with usage:', usage);
                },
                onStepFinish: async ({ stepType, text, toolCalls }) => {
                    console.log('[Chat API] Step finished:', { stepType, hasText: !!text, toolCallCount: toolCalls?.length });
                },
                stopWhen: hasLastPartAsTextPart,
            },
        });

        console.log('[Chat API] Stream created successfully');
        return createUIMessageStreamResponse({ stream });
    } catch (error) {
        console.error('[Chat API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500 }
        );
    }
}
