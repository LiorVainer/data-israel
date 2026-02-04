import { mastra } from '@/agents/mastra';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import { ChatThread } from '@/components/chat/ChatThread';

/** Default resource ID for server-side message hydration */
const DEFAULT_RESOURCE_ID = 'default-user';

/**
 * Chat page that displays a conversation thread.
 *
 * Server Component that fetches initial messages for hydration.
 * The ChatThread client component handles ongoing chat with proper user context.
 *
 * Note: Server-side uses DEFAULT_RESOURCE_ID for initial fetch.
 * The client will refetch with the actual userId from UserContext if needed.
 */
export default async function ChatPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ resourceId?: string }>;
}) {
    const { id } = await params;
    const { resourceId: queryResourceId } = await searchParams;

    // Use resourceId from query params if provided, otherwise default
    const resourceId = queryResourceId || DEFAULT_RESOURCE_ID;

    let initialMessages = toAISdkV5Messages([]);
    try {
        const memory = await mastra.getAgentById('routingAgent').getMemory();
        const response = await memory?.recall({
            threadId: id,
            resourceId,
        });
        if (response?.messages) {
            initialMessages = toAISdkV5Messages(response.messages);
        }
    } catch {
        // No previous messages or memory unavailable
    }

    return <ChatThread id={id} initialMessages={initialMessages} />;
}
