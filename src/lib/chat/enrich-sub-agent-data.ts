/**
 * Sub-Agent Data Enrichment
 *
 * Reconstructs data-tool-agent parts from sub-agent memory threads.
 * During live streaming, Mastra emits data-tool-agent parts with sub-agent tool call details.
 * These are streaming-only artifacts not stored in memory. On recall, we reconstruct them
 * by fetching the sub-agent's separate memory thread using subAgentThreadId.
 */

import { getToolName, isToolUIPart, type UIMessage } from 'ai';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import type { MastraMemory } from '@mastra/core/memory';
import type { AgentDataPart, AgentDataToolCall, AgentDataToolResult } from '@/components/chat/types';
import type { AgentDelegationResult } from '@/agents/types';
import { stripToolResult, TOOL_ARGS_KEEP_FIELDS } from '@/agents/utils';
import { pick } from 'es-toolkit';

function asRecord(value: unknown): Record<string, unknown> {
    return (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
}

function stripToolArgs(args: unknown): Record<string, unknown> {
    return pick(asRecord(args), [...TOOL_ARGS_KEEP_FIELDS]);
}

interface SubAgentRef {
    messageIndex: number;
    partIndex: number;
    agentName: string;
    threadId: string;
    resourceId: string;
}

export async function enrichWithSubAgentData(uiMessages: UIMessage[], memory: MastraMemory): Promise<void> {
    const subAgentRefs: SubAgentRef[] = [];

    for (let mi = 0; mi < uiMessages.length; mi++) {
        const msg = uiMessages[mi];
        if (msg.role !== 'assistant') continue;

        for (let pi = 0; pi < msg.parts.length; pi++) {
            const part = msg.parts[pi];
            if (!isToolUIPart(part)) continue;

            const toolName = getToolName(part);
            if (!toolName.startsWith('agent-')) continue;
            if (part.state !== 'output-available' || part.output == null) continue;

            const output = part.output as AgentDelegationResult;
            const { subAgentThreadId, subAgentResourceId } = output;
            if (!subAgentThreadId || !subAgentResourceId) continue;

            subAgentRefs.push({
                messageIndex: mi,
                partIndex: pi,
                agentName: toolName.replace('agent-', ''),
                threadId: subAgentThreadId,
                resourceId: subAgentResourceId,
            });
        }
    }

    if (subAgentRefs.length === 0) return;

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

    for (const { ref, subMessages } of results.reverse()) {
        if (subMessages.length === 0) continue;

        const toolCalls: AgentDataToolCall[] = [];
        const toolResults: AgentDataToolResult[] = [];

        for (const subMsg of subMessages) {
            if (subMsg.role !== 'assistant') continue;
            for (const subPart of subMsg.parts) {
                if (!isToolUIPart(subPart)) continue;

                const toolName = getToolName(subPart);

                toolCalls.push({
                    toolCallId: subPart.toolCallId,
                    toolName,
                    args: stripToolArgs(subPart.state === 'input-streaming' ? undefined : subPart.input),
                });

                if (subPart.state === 'output-available' && subPart.output != null) {
                    toolResults.push({
                        toolCallId: subPart.toolCallId,
                        toolName,
                        args: stripToolArgs(subPart.input),
                        result: stripToolResult(asRecord(subPart.output)),
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

        const msg = uiMessages[ref.messageIndex];
        msg.parts.splice(ref.partIndex + 1, 0, reconstructed as unknown as (typeof msg.parts)[number]);
    }
}
