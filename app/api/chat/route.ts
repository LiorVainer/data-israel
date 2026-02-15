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
import { AppUIMessage } from '@/agents/types';

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
const SUGGEST_TOOL_NAME = 'suggestFollowUps';

/**
 * Stop condition: requires BOTH a text response AND suggestFollowUps to have been called.
 *
 * Enforced flow:
 * 1. Agent calls data tools -> no text yet -> continue
 * 2. Agent calls source URL tools + suggestFollowUps -> has tool calls -> continue
 * 3. Agent writes final text -> text + no tool calls + suggestions called -> STOP
 *
 * If agent writes text without calling suggestFollowUps, loop continues so agent
 * can call it (instructions mandate this). MAX_STEPS is the safety fallback.
 */

const hasCompletedWithSuggestions: StopCondition<any> = ({ steps }) => {
    console.log({ steps: steps.length });
    if (steps.length > MAX_STEPS) return true;

    const lastStep = steps[steps.length - 1];

    // Condition 1: Last step must be a pure text response (no tool calls in this step)
    const hasTextResponse = !!lastStep?.text && !lastStep?.toolCalls?.length;
    if (!hasTextResponse) return false;

    // Condition 2: suggestFollowUps must have been called in some step
    const calledSuggestions = steps.some((step) =>
        step.toolCalls?.some((tc: { toolName: string }) => tc.toolName === SUGGEST_TOOL_NAME),
    );

    return calledSuggestions;
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

    console.log({ threadId, resourceId });

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

        const stream = await handleChatStream<AppUIMessage>({
            mastra,
            agentId: 'routingAgent',
            params: enhancedParams,
            defaultOptions: {
                toolCallConcurrency: 10,
                stopWhen: hasCompletedWithSuggestions,
            },
            sendReasoning: true,
            sendSources: true,
        });

        return createUIMessageStreamResponse({ stream });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500 },
        );
    }
}
