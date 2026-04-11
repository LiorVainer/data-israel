/**
 * Prepare Chat Context
 *
 * Parses and validates request params, then resolves all pre-stream context:
 * model config, Mastra instance, memory config, and user message pre-save.
 */

import type { UIMessage } from 'ai';
import type { Mastra } from '@mastra/core';
import type { ChatStreamHandlerParams } from '@mastra/ai-sdk';
import { getMastraWithModels } from '@/agents/mastra';
import type { AppUIMessage } from '@/agents/types';
import { AgentConfig } from '@/agents/agent.config';
import { resolveModelConfig } from '@/app/api/chat/resolve-model-config';
import { preSaveUserMessage } from './pre-save-user-message';
import { chatRequestSchema, type ChatRequestParams } from './chat-request.schema';

const { CHAT } = AgentConfig;
const isDev = process.env.NODE_ENV === 'development';

export interface ChatContext {
    dynamicMastra: Mastra;
    userId: string;
    threadId: string | undefined;
    userMessage: UIMessage | undefined;
    streamParams: ChatStreamHandlerParams<AppUIMessage>;
}

function getUserIdFromRequest(req: Request): string {
    return req.headers.get(CHAT.USER_ID_HEADER) || CHAT.DEFAULT_RESOURCE_ID;
}

/**
 * Validates the raw request body and resolves all pre-stream context.
 *
 * - Validates request body against chatRequestSchema (Zod)
 * - Resolves model config and creates the Mastra instance (with LRU-cached agents)
 * - Builds memory params (deferred title gen, first-message semantic recall skip)
 * - Fires pre-save of user message (non-blocking)
 * - Logs timing in development
 */
export async function prepareChatContext(req: Request, rawParams: unknown): Promise<ChatContext> {
    const params: ChatRequestParams = chatRequestSchema.parse(rawParams);

    const t0 = isDev ? performance.now() : 0;
    const modelConfig = await resolveModelConfig();
    const t1 = isDev ? performance.now() : 0;
    const dynamicMastra = await getMastraWithModels(modelConfig, params.enabledSources);
    const t2 = isDev ? performance.now() : 0;

    if (isDev) {
        console.log(
            `[chat POST timing] resolveModelConfig=${(t1 - t0).toFixed(0)}ms, getMastraWithModels=${(t2 - t1).toFixed(0)}ms, total_setup=${(t2 - t0).toFixed(0)}ms`,
        );
    }

    const userId = getUserIdFromRequest(req);

    // Memory config — ensure resourceId is set
    const threadId = params.memory?.thread;
    const memoryResource = params.memory?.resource || userId;

    // Client sends only the current user message via prepareSendMessagesRequest.
    // Zod validates structure; the full UIMessage shape is guaranteed by the AI SDK client.
    const userMessage = params.messages[0] as UIMessage | undefined;
    const isFirstMessage = userMessage?.role === 'user' && params.messages.length === 1;

    // Title generation is always deferred to onFinish (fire-and-forget).
    // On first message, also skip semantic recall (empty thread = nothing to search).
    const memoryParam = threadId
        ? {
              thread: threadId,
              resource: memoryResource,
              options: {
                  generateTitle: false,
                  ...(isFirstMessage && { semanticRecall: false }),
              },
          }
        : undefined;

    // Fire-and-forget: pre-save user message so it survives page refresh during streaming.
    if (threadId && userMessage) {
        void preSaveUserMessage(dynamicMastra, userMessage, threadId, memoryResource).catch((e: unknown) =>
            console.warn('[chat POST] preSaveUserMessage failed:', e),
        );
    }

    return {
        dynamicMastra,
        userId,
        threadId,
        userMessage,
        streamParams: { ...params, memory: memoryParam } as ChatStreamHandlerParams<AppUIMessage>,
    };
}
