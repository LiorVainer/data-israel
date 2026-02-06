'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useEffect, useRef } from 'react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { MessageItem } from '@/components/chat/MessageItem';
import { InputSection } from '@/components/chat/InputSection';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { INITIAL_MESSAGE_KEY, type InitialMessageData } from '@/constants/chat';
import { useUser } from '@/context/UserContext';

/** Default resource ID for unauthenticated users */

/** Header name for passing user ID to API */
const USER_ID_HEADER = 'x-user-id';

interface ChatThreadProps {
    id: string;
    initialMessages: UIMessage[];
    resourceId: string | null;
}

export function ChatThread({ id, initialMessages, resourceId }: ChatThreadProps) {
    const initialMessageSentRef = useRef(false);
    const { sessionId } = useUser();
    const userId = resourceId ?? `session:${sessionId}`;

    const [initialMessageData, , removeInitialMessage] = useSessionStorage<InitialMessageData>(INITIAL_MESSAGE_KEY);

    const { messages, sendMessage, status, regenerate, stop } = useChat({
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            headers: {
                [USER_ID_HEADER]: userId,
            },
            prepareSendMessagesRequest({ messages }) {
                return {
                    body: {
                        messages,
                        memory: {
                            thread: id,
                            resource: userId,
                        },
                    },
                };
            },
        }),
    });

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
        <div className='relative h-full w-full'>
            <GeometricBackground noShapes />

            <div className='mx-auto px-4 md:px-0 pb-4 md:pb-6 relative h-full w-full'>
                <div className='flex flex-col gap-4 md:gap-6 h-full w-full items-center'>
                    <Conversation className='w-full children-noscrollbar'>
                        <ConversationContent className='w-full md:w-4xl pt-12 md:pt-10 mx-auto'>
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
