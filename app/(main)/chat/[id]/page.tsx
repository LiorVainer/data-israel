import { ChatThread } from '@/components/chat/ChatThread';

/**
 * Chat page that displays a conversation thread.
 *
 * Lightweight server component — auth resolution and message hydration
 * are handled client-side in ChatThread for instant navigation transitions.
 */
export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <ChatThread id={id} />;
}
