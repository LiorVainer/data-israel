/**
 * Sub-Agent Data Enrichment
 *
 * Reconstructs data-tool-agent parts from sub-agent memory threads.
 * During live streaming, Mastra emits data-tool-agent parts with sub-agent tool call details.
 * These are streaming-only artifacts not stored in memory. On recall, we reconstruct them
 * by fetching the sub-agent's separate memory thread using subAgentThreadId.
 */

import type { UIMessage } from 'ai';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import type { MastraMemory } from '@mastra/core/memory';
import {
    type AgentDataPart,
    type AgentDataToolCall,
    type AgentDataToolResult,
    isToolPart,
    type ToolCallPart,
} from '@/components/chat/types';
import { stripToolResult, TOOL_ARGS_KEEP_FIELDS } from '@/agents/processors/truncate-tool-results.processor';
import { pick } from 'es-toolkit';

function stripToolArgs(args: Record<string, unknown>): Record<string, unknown> {
    return pick(args, [...TOOL_ARGS_KEEP_FIELDS]);
}

export async function enrichWithSubAgentData(uiMessages: UIMessage[], memory: MastraMemory): Promise<void> {
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
