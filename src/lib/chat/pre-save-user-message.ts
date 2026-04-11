/**
 * Pre-Save User Message
 *
 * Eagerly persists the user message to Mastra memory before streaming begins.
 *
 * Mastra's `savePerStep` only accumulates messages in-memory without flushing
 * to storage, and the final `executeOnFinish` is gated by `!abortSignal.aborted`.
 * If the user refreshes mid-stream, abort fires and the user message is lost.
 *
 * Convex's `batchInsert` is an upsert by ID, so when `executeOnFinish` later
 * saves the same message on normal completion, it patches the existing record.
 */

import type { UIMessage } from 'ai';
import type { Mastra } from '@mastra/core';
import { extractUserText } from './message-utils';

export async function preSaveUserMessage(
    mastraInstance: Mastra,
    userMessage: UIMessage,
    threadId: string,
    resourceId: string,
): Promise<void> {
    const textParts = extractUserText(userMessage);
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
                id: userMessage.id,
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
