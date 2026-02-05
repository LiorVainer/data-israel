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

/** Default resource ID for unauthenticated users */
const DEFAULT_RESOURCE_ID = 'default-user';

/** Header name for passing user ID from client */
const USER_ID_HEADER = 'x-user-id';

/**
 * POST /api/chat
 *
 * Handles chat messages and streams agent responses via the routing agent.
 */
export const maxDuration = 120;
export const dynamic = 'force-dynamic';
const MAX_STEPS = 10;

const hasLastPartAsTextPart: StopCondition<any> = ({ steps }) => {
    const stepsAmount = steps.length;
    if (stepsAmount > MAX_STEPS) return true;

    const lastStep = steps[steps.length - 1];
    return !!lastStep?.text && !lastStep?.toolCalls?.length;
};

/**
 * Extracts user ID from request headers or returns default.
 *
 * Priority:
 * 1. x-user-id header (set by client from UserContext)
 * 2. Default fallback for unauthenticated users
 */
function getUserIdFromRequest(req: Request): string {
    const headerUserId = req.headers.get(USER_ID_HEADER);
    if (headerUserId) {
        return headerUserId;
    }
    return DEFAULT_RESOURCE_ID;
}

/**
 * GET /api/chat?threadId=...&resourceId=...
 *
 * Retrieves stored chat messages from Mastra memory for hydrating the UI on page load.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    const resourceId = searchParams.get('resourceId') || getUserIdFromRequest(req);

    if (!threadId || !resourceId) {
        return NextResponse.json([]);
    }

    const memory = await mastra.getAgentById('routingAgent').getMemory();
    let response = null;

    try {
        response = await memory?.recall({
            threadId,
            resourceId,
        });

        console.log({ response });
    } catch {
        // No previous messages found
    }

    const uiMessages = toAISdkV5Messages(response?.messages || []);
    return NextResponse.json(uiMessages);
}

export async function POST(req: Request) {
    try {
        const params = await req.json();

        // Get user ID from header or use the one provided in the body
        const userId = getUserIdFromRequest(req);

        // Ensure memory config includes proper resourceId
        // The memory.thread is required by Mastra, ensure it's passed through
        const memoryConfig = params.memory ?? {};
        if (memoryConfig.thread) {
            memoryConfig.resource = memoryConfig.resource || userId;
        }

        const enhancedParams = {
            ...params,
            memory: memoryConfig.thread ? memoryConfig : undefined,
        };

        const stream = await handleChatStream({
            mastra,
            agentId: 'routingAgent',
            params: enhancedParams,
            defaultOptions: {
                toolCallConcurrency: 10,
                stopWhen: hasLastPartAsTextPart,
            },
        });

        return createUIMessageStreamResponse({ stream });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500 },
        );
    }
}
