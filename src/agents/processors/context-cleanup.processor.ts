/**
 * ContextCleanup Processor
 *
 * Reduces token waste at two points in the agent lifecycle:
 *
 * 1. processInputStep (routing agent) — before each LLM call, strips
 *    subAgentToolResults and data-tool-agent parts so the routing agent
 *    never pays tokens for sub-agent internal tool data.
 *
 * 2. processOutputResult (all agents) — before memory storage, strips
 *    bulky tool result payloads down to UI-required fields (source URLs,
 *    success/error, metadata).
 */

import type { ProcessInputStepArgs, Processor } from '@mastra/core/processors';
import type { MastraDBMessage, MastraMessagePart } from '@mastra/core/agent/message-list';
import {
    isCompletedAgentDelegation,
    isCompletedToolInvocation,
    isToolInvocationPart,
    isDataToolAgentPart,
    stripToolResult,
} from '@/agents/utils';

function stripPartsToolData(parts: MastraMessagePart[]): void {
    for (const part of parts) {
        if (!isToolInvocationPart(part)) continue;

        const inv = part.toolInvocation;
        if (isCompletedAgentDelegation(inv)) {
            delete inv.result.subAgentToolResults;
        } else if (isCompletedToolInvocation(inv)) {
            inv.result = stripToolResult(inv.result);
        }
    }
}

function stripSubAgentBloat(msg: MastraDBMessage): void {
    const { content } = msg;

    if (content.toolInvocations) {
        for (const inv of content.toolInvocations) {
            if (isCompletedAgentDelegation(inv)) {
                delete inv.result.subAgentToolResults;
            }
        }
    }

    stripPartsToolData(content.parts);
    content.parts = content.parts.filter((p) => !isDataToolAgentPart(p));
}

export class ContextCleanupProcessor implements Processor {
    readonly id = 'context-cleanup';

    async processInputStep({ messages, messageList }: ProcessInputStepArgs) {
        for (const msg of messages) {
            if (msg.role !== 'assistant') continue;
            stripSubAgentBloat(msg);
        }
        return messageList;
    }

    async processOutputResult({
        messages,
    }: {
        messages: MastraDBMessage[];
        abort: (reason?: string) => never;
    }): Promise<MastraDBMessage[]> {
        for (const msg of messages) {
            if (msg.role !== 'assistant') continue;

            const { content } = msg;

            if (content.toolInvocations) {
                for (const inv of content.toolInvocations) {
                    if (isCompletedAgentDelegation(inv)) {
                        delete inv.result.subAgentToolResults;
                    } else if (isCompletedToolInvocation(inv)) {
                        inv.result = stripToolResult(inv.result);
                    }
                }
            }

            stripPartsToolData(content.parts);
            content.parts = content.parts.filter((p) => !isDataToolAgentPart(p));
        }
        return messages;
    }
}
