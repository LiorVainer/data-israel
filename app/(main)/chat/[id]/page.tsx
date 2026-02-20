'use client';

import { useParams } from 'next/navigation';
import { ChatThread } from '@/components/chat/ChatThread';

/**
 * Chat page — client component to avoid Suspense boundary flash.
 * Auth resolution and message hydration are handled in ChatThread.
 */
export default function ChatPage() {
    const { id } = useParams<{ id: string }>();

    return <ChatThread id={id} />;
}
