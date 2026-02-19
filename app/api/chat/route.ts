/**
 * Chat API Route
 *
 * Streaming endpoint using Mastra agent network
 */

import { createUIMessageStreamResponse, StopCondition, UIMessage } from 'ai';
import { NextResponse } from 'next/server';
import { mastra } from '@/agents/mastra';
import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import { AppUIMessage } from '@/agents/types';
import { AgentConfig } from '@/agents/agent.config';
import { convexMutation, api } from '@/lib/convex/client';
import type { MastraMemory } from '@mastra/core/memory';
import {
    isToolPart,
    type AgentDataPart,
    type AgentDataToolCall,
    type AgentDataToolResult,
    type ToolCallPart,
} from '@/components/chat/types';

const { CHAT } = AgentConfig;

/**
 * POST /api/chat
 *
 * Handles chat messages and streams agent responses via the routing agent.
 */
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

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
    if (steps.length > CHAT.MAX_STEPS) return true;

    const lastStep = steps[steps.length - 1];

    // Condition 1: Last step must be a pure text response (no tool calls in this step)
    const hasTextResponse = !!lastStep?.text && !lastStep?.toolCalls?.length;
    if (!hasTextResponse) return false;

    // Condition 2: suggestFollowUps must have been called in some step
    const calledSuggestions = steps.some((step) =>
        step.toolCalls?.some((tc: { toolName: string }) => tc.toolName === CHAT.SUGGEST_TOOL_NAME),
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
    const headerUserId = req.headers.get(CHAT.USER_ID_HEADER);
    if (headerUserId) {
        return headerUserId;
    }

    return CHAT.DEFAULT_RESOURCE_ID;
}

/**
 * Reconstructs data-tool-agent parts from sub-agent memory threads.
 * During live streaming, Mastra emits data-tool-agent parts with sub-agent tool call details.
 * These are streaming-only artifacts not stored in memory. On recall, we reconstruct them
 * by fetching the sub-agent's separate memory thread using subAgentThreadId.
 */
async function enrichWithSubAgentData(
    uiMessages: UIMessage[],
    memory: MastraMemory,
): Promise<void> {
    // Collect all sub-agent thread references from tool-agent-* parts
    const subAgentRefs: Array<{
        messageIndex: number;
        partIndex: number;
        agentName: string;
        threadId: string;
        resourceId: string;
    }> = [];

    for (let mi = 0; mi < uiMessages.length; mi++) {
        const msg = uiMessages[mi];
        if (msg.role !== 'assistant') continue;

        for (let pi = 0; pi < msg.parts.length; pi++) {
            const part = msg.parts[pi];
            if (!part.type.startsWith('tool-agent-')) continue;

            const toolPart = part as unknown as ToolCallPart;
            if (toolPart.state !== 'output-available' || !toolPart.output) continue;

            const output = toolPart.output as Record<string, unknown>;
            const threadId = output.subAgentThreadId;
            const resourceId = output.subAgentResourceId;

            if (typeof threadId !== 'string' || typeof resourceId !== 'string') continue;

            subAgentRefs.push({
                messageIndex: mi,
                partIndex: pi,
                agentName: part.type.replace('tool-agent-', ''),
                threadId,
                resourceId,
            });
        }
    }

    if (subAgentRefs.length === 0) return;

    // Fetch sub-agent threads in parallel
    const results = await Promise.all(
        subAgentRefs.map(async (ref) => {
            try {
                const result = await memory.recall({
                    threadId: ref.threadId,
                    resourceId: ref.resourceId,
                });
                const subMessages = toAISdkV5Messages(result?.messages || []);
                return { ref, subMessages };
            } catch {
                return { ref, subMessages: [] as UIMessage[] };
            }
        }),
    );

    // Reconstruct and inject data-tool-agent parts (process in reverse to preserve indices)
    for (const { ref, subMessages } of results.reverse()) {
        if (subMessages.length === 0) continue;

        const toolCalls: AgentDataToolCall[] = [];
        const toolResults: AgentDataToolResult[] = [];

        for (const subMsg of subMessages) {
            if (subMsg.role !== 'assistant') continue;
            for (const subPart of subMsg.parts) {
                if (!isToolPart(subPart)) continue;
                const tp = subPart as unknown as ToolCallPart;
                const toolName = subPart.type.replace('tool-', '');

                toolCalls.push({
                    toolCallId: tp.toolCallId ?? '',
                    toolName,
                    args: (tp.input ?? {}) as Record<string, unknown>,
                });

                if (tp.state === 'output-available' && tp.output != null) {
                    toolResults.push({
                        toolCallId: tp.toolCallId ?? '',
                        toolName,
                        args: (tp.input ?? {}) as Record<string, unknown>,
                        result: (tp.output ?? {}) as Record<string, unknown>,
                    });
                }
            }
        }

        if (toolCalls.length === 0) continue;

        const reconstructed: AgentDataPart = {
            type: 'data-tool-agent',
            id: ref.agentName,
            data: {
                id: ref.agentName,
                status: 'finished',
                text: '',
                toolCalls,
                toolResults,
                steps: [],
                finishReason: 'tool-calls',
                usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            },
        };

        // Inject right after the tool-agent-* part
        const msg = uiMessages[ref.messageIndex];
        msg.parts.splice(ref.partIndex + 1, 0, reconstructed as unknown as (typeof msg.parts)[number]);
    }
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
    } catch {
        // No previous messages found
    }

    const uiMessages = toAISdkV5Messages(response?.messages || []);

    // Enrich with sub-agent internal tool call data (two-pass recall)
    if (memory) {
        await enrichWithSubAgentData(uiMessages, memory);
    }

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

        const threadId: string | undefined = memoryConfig.thread;

        const enhancedParams = {
            ...params,
            memory: memoryConfig.thread ? memoryConfig : undefined,
        };

        const stream = await handleChatStream<AppUIMessage>({
            mastra,
            agentId: 'routingAgent',
            params: enhancedParams,
            defaultOptions: {
                toolCallConcurrency: CHAT.TOOL_CALL_CONCURRENCY,
                stopWhen: hasCompletedWithSuggestions,
                onFinish: ({ totalUsage, model }) => {
                    if (!threadId) return;
                    const promptTokens = totalUsage.inputTokens ?? 0;
                    const completionTokens = totalUsage.outputTokens ?? 0;
                    const totalTokens = totalUsage.totalTokens ?? promptTokens + completionTokens;
                    void convexMutation(api.threads.insertThreadUsage, {
                        threadId,
                        userId,
                        agentName: 'routingAgent',
                        model: model?.modelId ?? AgentConfig.MODEL.DEFAULT_ID,
                        provider: model?.provider ?? 'openrouter',
                        usage: {
                            promptTokens,
                            completionTokens,
                            totalTokens,
                            reasoningTokens: totalUsage.reasoningTokens,
                            cachedInputTokens: totalUsage.cachedInputTokens,
                        },
                    });
                },
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
