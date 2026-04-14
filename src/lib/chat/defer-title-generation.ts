/**
 * Deferred Thread Title Generation
 *
 * Generates a thread title from the user message and saves it to memory.
 * Designed to run fire-and-forget after streaming completes — deferred from
 * Mastra's built-in generateTitle to avoid blocking the stream with an extra LLM call.
 *
 * The client sends only the current user message via prepareSendMessagesRequest,
 * so `userMessage` is always the single message from the request body.
 */

import type { UIMessage } from 'ai';
import type { Mastra } from '@mastra/core';
import { extractUserText } from './message-utils';

export async function deferTitleGeneration(
    dynamicMastra: Mastra,
    userMessage: UIMessage,
    threadId: string,
): Promise<void> {
    const userText = extractUserText(userMessage);
    if (!userText) return;

    const agent = dynamicMastra.getAgentById('routingAgent');
    const memory = await agent.getMemory();
    if (!memory) return;

    const title = await agent.generateTitleFromUserMessage({ message: userText });
    if (!title) return;

    const thread = await memory.getThreadById({ threadId });
    if (thread) {
        await memory.saveThread({ thread: { ...thread, title } });
    }
}
