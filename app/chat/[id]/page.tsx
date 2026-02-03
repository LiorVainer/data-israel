import { mastra } from '@/agents/mastra';
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import { ChatThread } from '@/components/chat/ChatThread';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let initialMessages = toAISdkV5Messages([]);
    try {
        const memory = await mastra.getAgentById('routingAgent').getMemory();
        const response = await memory?.recall({
            threadId: id,
            resourceId: 'default-user',
        });
        if (response?.messages) {
            initialMessages = toAISdkV5Messages(response.messages);
        }
    } catch {
        // No previous messages or memory unavailable
    }

    return <ChatThread id={id} initialMessages={initialMessages} />;
}
