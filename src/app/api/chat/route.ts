/**
 * Chat API Route
 *
 * Streaming endpoint using Mastra agent network
 */

import { createUIMessageStreamResponse, StopCondition, UIMessage } from 'ai';
import { NextResponse } from 'next/server';
import { getMastraWithModels, mastra } from '@/agents/mastra';
import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import { AppUIMessage } from '@/agents/types';
import { AgentConfig } from '@/agents/agent.config';
import { api, convexMutation } from '@/lib/convex/client';
import { resolveModelConfig } from './resolve-model-config';
import type { MastraMemory } from '@mastra/core/memory';
import type { Mastra } from '@mastra/core';
import {
    type AgentDataPart,
    type AgentDataToolCall,
    type AgentDataToolResult,
    isToolPart,
    type ToolCallPart,
} from '@/components/chat/types';
import { clearActiveStreamId } from '@/lib/redis/resumable-stream';
import { ALL_DATA_SOURCE_IDS, type DataSource } from '@/data-sources/registry';
import { sendPushToUser } from '@/lib/push/send-notification';
import { stripToolResult, TOOL_ARGS_KEEP_FIELDS } from '@/agents/processors/truncate-tool-results.processor';
import { pick } from 'es-toolkit';
import { type GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';

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
    return steps.some((step) => step.toolCalls?.some((tc) => tc.toolName === CHAT.SUGGEST_TOOL_NAME));
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

function stripToolArgs(args: Record<string, unknown>): Record<string, unknown> {
    return pick(args, [...TOOL_ARGS_KEEP_FIELDS]);
}

/**
 * Pre-saves the user message to memory before streaming begins.
 *
 * Mastra's `savePerStep` only accumulates messages in-memory without flushing
 * to storage, and the final `executeOnFinish` is gated by `!abortSignal.aborted`.
 * If the user refreshes mid-stream, abort fires and the user message is lost.
 *
 * This workaround eagerly persists the user message. Convex's `batchInsert`
 * is an upsert by ID, so when `executeOnFinish` later saves the same message
 * on normal completion, it simply patches the existing record — no duplicates.
 */
async function preSaveUserMessage(
    mastraInstance: Mastra,
    messages: UIMessage[],
    threadId: string,
    resourceId: string,
): Promise<void> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    const textParts = lastUserMsg.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('\n');

    if (!textParts) return;

    const memory = await mastraInstance.getAgentById('routingAgent').getMemory();
    if (!memory) return;

    // Ensure thread exists before saving the message
    const existingThread = await memory.getThreadById({ threadId });
    if (!existingThread) {
        await memory.createThread({ threadId, resourceId });
    }

    await memory.saveMessages({
        messages: [
            {
                id: lastUserMsg.id,
                role: 'user' as const,
                createdAt: new Date(),
                threadId,
                resourceId,
                content: {
                    format: 2,
                    parts: [{ type: 'text' as const, text: textParts }],
                },
            },
        ],
    });
}

/**
 * Reconstructs data-tool-agent parts from sub-agent memory threads.
 * During live streaming, Mastra emits data-tool-agent parts with sub-agent tool call details.
 * These are streaming-only artifacts not stored in memory. On recall, we reconstruct them
 * by fetching the sub-agent's separate memory thread using subAgentThreadId.
 */
async function enrichWithSubAgentData(uiMessages: UIMessage[], memory: MastraMemory): Promise<void> {
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
                    args: stripToolArgs((tp.input ?? {}) as Record<string, unknown>),
                });

                if (tp.state === 'output-available' && tp.output != null) {
                    toolResults.push({
                        toolCallId: tp.toolCallId ?? '',
                        toolName,
                        args: stripToolArgs((tp.input ?? {}) as Record<string, unknown>),
                        result: stripToolResult((tp.output ?? {}) as Record<string, unknown>),
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
        try {
            await enrichWithSubAgentData(uiMessages, memory);
        } catch (e) {
            console.error('[chat GET] enrichWithSubAgentData failed:', e);
            // Return messages without sub-agent enrichment rather than failing entirely
        }
    }

    return NextResponse.json(uiMessages);
}

export async function POST(req: Request) {
    try {
        const params = await req.json();

        // Validate enabled data sources filter
        const rawEnabledSources: unknown = params.enabledSources;
        const enabledSources: DataSource[] | undefined =
            Array.isArray(rawEnabledSources) && rawEnabledSources.length > 0
                ? rawEnabledSources.filter(
                      (s): s is DataSource =>
                          typeof s === 'string' && (ALL_DATA_SOURCE_IDS as readonly string[]).includes(s),
                  )
                : undefined;

        // Resolve per-agent model config (Convex → env vars → defaults)
        const modelConfig = await resolveModelConfig();
        const dynamicMastra = await getMastraWithModels(modelConfig, enabledSources);

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

        // Context snapshot: overridden each step (last step = actual context window size).
        const contextSnapshot = {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            reasoningTokens: 0,
            cachedInputTokens: 0,
        };

        // Billing accumulator: summed across all steps (real API cost per turn).
        const billingUsage = {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            reasoningTokens: 0,
            cachedInputTokens: 0,
        };

        // Pre-save user message so it survives page refresh during streaming.
        // Mastra's executeOnFinish (which saves all messages) is gated by !abortSignal.aborted,
        // so on refresh the user message would otherwise be lost.
        if (threadId && memoryConfig.resource) {
            try {
                await preSaveUserMessage(dynamicMastra, params.messages, threadId, memoryConfig.resource);
            } catch (e) {
                console.warn('[chat POST] preSaveUserMessage failed:', e);
            }
        }

        const stream = await handleChatStream<AppUIMessage>({
            mastra: dynamicMastra,
            agentId: 'routingAgent',
            params: enhancedParams,
            defaultOptions: {
                // OpenRouter reasoning/thinking control (via @openrouter/ai-sdk-provider).
                // Docs: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens
                //
                // For Gemini thinking models, use `max_tokens` (maps to thinkingBudget):
                //   max_tokens: 1024   — limit thinking tokens
                //
                // For OpenAI-style models (o3, gpt-5), use `effort`:
                //   effort: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
                //
                providerOptions: {
                    // openrouter: {
                    //     reasoning: {
                    //         max_tokens: 1024, // for Gemini thinking models
                    //         // effort: 'low', // for OpenAI-style reasoning models
                    //         // exclude: true,  // hide reasoning from response
                    //     },
                    // },
                    google: {
                        thinkingConfig: {
                            thinkingLevel: 'minimal',
                        },
                    } satisfies GoogleGenerativeAIProviderOptions,
                },
                toolCallConcurrency: CHAT.TOOL_CALL_CONCURRENCY,
                delegation: {
                    onDelegationStart: async () => {
                        return { modifiedMaxSteps: 15 };
                    },
                    onDelegationComplete: async (context) => {
                        if (context.success && !context.result.text?.trim()) {
                            return {
                                feedback:
                                    'הסוכן החזיר תוצאות כלים אך ללא טקסט מסכם. הנתונים נמצאים בתוצאות הכלים — פרש אותם ישירות וכתוב תשובה מלאה.',
                            };
                        }
                    },
                },
                stopWhen: hasCompletedWithSuggestions,
                onStepFinish: ({ usage, toolResults }) => {
                    // Debug: log sub-agent delegation results
                    if (process.env.NODE_ENV === 'development') {
                        for (const tr of toolResults) {
                            const { toolName, result } = tr.payload;
                            if (toolName.startsWith('agent-')) {
                                // You can Add Agent Result Handler Here
                            }
                        }
                    }

                    // Context snapshot: override (last step = context window size)
                    contextSnapshot.inputTokens = usage.inputTokens ?? 0;
                    contextSnapshot.outputTokens = usage.outputTokens ?? 0;
                    contextSnapshot.totalTokens = usage.totalTokens ?? 0;
                    contextSnapshot.reasoningTokens = usage.reasoningTokens ?? 0;
                    contextSnapshot.cachedInputTokens = usage.cachedInputTokens ?? 0;
                    // Billing: accumulate (sum of all steps = real API cost)
                    billingUsage.inputTokens += usage.inputTokens ?? 0;
                    billingUsage.outputTokens += usage.outputTokens ?? 0;
                    billingUsage.totalTokens += usage.totalTokens ?? 0;
                    billingUsage.reasoningTokens += usage.reasoningTokens ?? 0;
                    billingUsage.cachedInputTokens += usage.cachedInputTokens ?? 0;
                },
                onFinish: ({ model }) => {
                    if (!threadId) return;
                    const modelId = model?.modelId ?? AgentConfig.MODEL.DEFAULT_ID;
                    const provider = model?.provider ?? 'openrouter';

                    // Context window snapshot (for UI indicator)
                    void convexMutation(api.threads.upsertThreadContext, {
                        threadId,
                        userId,
                        agentName: 'routingAgent',
                        model: modelId,
                        provider,
                        usage: {
                            promptTokens: contextSnapshot.inputTokens,
                            completionTokens: contextSnapshot.outputTokens,
                            totalTokens: contextSnapshot.totalTokens,
                            reasoningTokens: contextSnapshot.reasoningTokens || undefined,
                            cachedInputTokens: contextSnapshot.cachedInputTokens || undefined,
                        },
                    });

                    // Billing record (accumulated real API cost, not shown in UI)
                    void convexMutation(api.threads.upsertThreadBilling, {
                        threadId,
                        userId,
                        agentName: 'routingAgent',
                        model: modelId,
                        provider,
                        usage: {
                            promptTokens: billingUsage.inputTokens,
                            completionTokens: billingUsage.outputTokens,
                            totalTokens: billingUsage.totalTokens,
                            reasoningTokens: billingUsage.reasoningTokens || undefined,
                            cachedInputTokens: billingUsage.cachedInputTokens || undefined,
                        },
                    });

                    // Clear the resumable stream mapping now that streaming is complete
                    void clearActiveStreamId(threadId);

                    // Notify user that their answer is ready (fire-and-forget)
                    void sendPushToUser(userId, {
                        threadId,
                        title: 'התשובה מוכנה ✨',
                        body: 'התשובה לשאלתך מוכנה. לחץ כדי לצפות.',
                    });
                },
            },
            sendReasoning: true,
            sendSources: true,
        });

        return createUIMessageStreamResponse({
            stream,
            // consumeSseStream: async ({ stream: sseStream }) => {
            //     try {
            //         const streamContext = await getResumableStreamContext(after);
            //         if (!streamContext || !threadId) return;
            //
            //         const streamId = generateId();
            //         // Wrap in Promise to catch Redis-level rejections (e.g. max request size)
            //         // that fire inside the redis client before our try/catch can intercept.
            //         await Promise.resolve(streamContext.createNewResumableStream(streamId, () => sseStream)).catch(
            //             (err: unknown) => {
            //                 const msg = err instanceof Error ? err.message : String(err);
            //                 if (msg.includes('max request size exceeded')) {
            //                     console.warn(
            //                         '[resumable-stream] Stream too large for Redis storage, skipping resumable save',
            //                     );
            //                 } else {
            //                     throw err;
            //                 }
            //             },
            //         );
            //         await setActiveStreamId(threadId, streamId);
            //     } catch (error: unknown) {
            //         // Silently handle Redis size limit errors — stream still works for the
            //         // active client, it just won't be resumable for oversized responses.
            //         const message = error instanceof Error ? error.message : String(error);
            //         if (message.includes('max request size exceeded')) {
            //             console.warn('[resumable-stream] Stream too large for Redis storage, skipping resumable save');
            //         } else {
            //             console.error('[resumable-stream] consumeSseStream error:', message);
            //         }
            //     }
            // },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500 },
        );
    }
}
