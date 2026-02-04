'use client';

import { type UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef } from 'react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { MessageItem } from '@/components/chat/MessageItem';
import { InputSection } from '@/components/chat/InputSection';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { INITIAL_MESSAGE_KEY, type InitialMessageData } from '@/constants/chat';
import { useUser } from '@/context/UserContext';

/** Default resource ID for unauthenticated users */
const DEFAULT_RESOURCE_ID = 'default-user';

/** Header name for passing user ID to API */
const USER_ID_HEADER = 'x-user-id';

interface ChatThreadProps {
    id: string;
    initialMessages: UIMessage[];
}

export function ChatThread({ id, initialMessages }: ChatThreadProps) {
    const initialMessageSentRef = useRef(false);
    const { userId, sessionId } = useUser();

    const [initialMessageData, , removeInitialMessage] = useSessionStorage<InitialMessageData>(INITIAL_MESSAGE_KEY);

    // Compute the resource ID for memory operations
    // Use userId if available (authenticated or guest), otherwise fall back to sessionId or default
    const resourceId = useMemo(() => {
        if (userId) {
            return userId;
        }
        if (sessionId) {
            return `session:${sessionId}`;
        }
        return DEFAULT_RESOURCE_ID;
    }, [userId, sessionId]);

    const { messages, sendMessage, status, regenerate, stop } = useChat({
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            headers: {
                [USER_ID_HEADER]: resourceId,
            },
            prepareSendMessagesRequest({ messages }) {
                return {
                    body: {
                        messages,
                        memory: {
                            thread: id,
                            resource: resourceId,
                        },
                    },
                };
            },
        }),
    });

    console.log({ status });

    // Send initial message from session storage
    useEffect(() => {
        if (initialMessageSentRef.current) return;
        if (!initialMessageData) return;
        if (initialMessageData.chatId !== id) return;

        initialMessageSentRef.current = true;
        removeInitialMessage();
        void sendMessage({ text: initialMessageData.text });
    }, [id, initialMessageData, removeInitialMessage, sendMessage]);

    const isStreaming = status === 'submitted' || status === 'streaming';

    return (
        <div className='relative h-dvh w-screen'>
            <GeometricBackground noShapes />

            <div className='mx-auto px-4 md:px-0 pb-4 md:pb-6 relative h-full w'>
                <div className='flex flex-col gap-4 md:gap-6 h-full w-full items-center'>
                    <Conversation className='w-full children-noscrollbar'>
                        <ConversationContent className='w-full md:w-4xl pt-8 md:pt-10 mx-auto'>
                            {messages.map((message, messageIndex) => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    isLastMessage={messageIndex === messages.length - 1}
                                    isStreaming={isStreaming}
                                    onRegenerate={regenerate}
                                />
                            ))}
                            {status === 'submitted' && <LoadingShimmer />}
                        </ConversationContent>
                        <ConversationScrollButton />
                    </Conversation>

                    <div className='relative z-20 w-full md:w-4xl'>
                        <InputSection onSubmit={(text) => void sendMessage({ text })} status={status} onStop={stop} />
                    </div>
                </div>
            </div>
        </div>
    );
}
