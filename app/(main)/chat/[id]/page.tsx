import { auth } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { mastra } from '@/agents/mastra';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import { ChatThread } from '@/components/chat/ChatThread';
import { api } from '@/convex/_generated/api';

/**
 * Chat page that displays a conversation thread.
 *
 * Server Component that resolves the authenticated user's resourceId via Convex auth
 * and fetches initial messages for hydration.
 *
 * For authenticated users: resolves Clerk subject via ctx.auth.getUserIdentity().
 * For guests: passes empty messages — ChatThread handles client-side hydration.
 */
export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Resolve resourceId from Convex auth (Clerk JWT)
    let resourceId: string | null = null;
    try {
        const { getToken } = await auth();
        const token = await getToken({ template: 'convex' });

        console.log({ token });

        if (token) {
            resourceId = await fetchQuery(api.threads.getAuthResourceId, {}, { token });
        }
    } catch (e) {
        console.log(e);
    }
    console.log({ resourceId });

    // Hydrate messages for authenticated users only
    let initialMessages = toAISdkV5Messages([]);
    if (resourceId) {
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
    }

    return <ChatThread id={id} initialMessages={initialMessages} />;
}
