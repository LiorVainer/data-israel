'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { threadService } from '@/services/thread.service';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { MessageItem } from '@/components/chat/MessageItem';
import { InputSection } from '@/components/chat/InputSection';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { DataIsraelLoader } from '@/components/chat/DataIsraelLoader';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { INITIAL_MESSAGE_KEY, type InitialMessageData } from '@/constants/chat';
import { useUser } from '@/context/UserContext';

/** Header name for passing user ID to API */
const USER_ID_HEADER = 'x-user-id';

interface ChatThreadProps {
    id: string;
}

export function ChatThread({ id }: ChatThreadProps) {
    const { userId: clerkUserId, isLoaded: isAuthLoaded } = useAuth();
    const { guestId } = useUser();

    const userId = clerkUserId ?? guestId;

    const [initialMessageData, , removeInitialMessage] = useSessionStorage<InitialMessageData>(INITIAL_MESSAGE_KEY);
    const isNewConversation = initialMessageData?.chatId === id;

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat',
                headers: {
                    [USER_ID_HEADER]: userId ?? 'anonymous',
                },
                prepareSendMessagesRequest({ messages }) {
                    console.log(userId);
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
        [id, userId],
    );

    const { messages, sendMessage, setMessages, status, regenerate, stop } = useChat({
        messages: [] as UIMessage[],
        transport,
    });

    // Hydrate existing messages for returning conversations (not new ones)
    const { data: hydratedMessages } = useQuery({
        queryKey: ['threads', id, 'messages', userId],
        queryFn: () => threadService.getMessages(id, userId!),
        enabled: !isNewConversation && isAuthLoaded && !!userId,
    });

    const didHydrate = useRef(false);

    useEffect(() => {
        if (didHydrate.current || !hydratedMessages?.length) return;
        didHydrate.current = true;
        setMessages(hydratedMessages);
    }, [hydratedMessages, setMessages]);

    useEffect(() => {
        if (!initialMessageData || initialMessageData.chatId !== id || !isAuthLoaded) return;

        removeInitialMessage();
        void sendMessage({ text: initialMessageData.text });
    }, [id, initialMessageData, removeInitialMessage, sendMessage, isAuthLoaded]);

    const isStreaming = status === 'submitted' || status === 'streaming';

    return (
        <div className='relative h-full w-full'>
            <GeometricBackground noShapes />

            <div className='mx-auto px-4 md:px-0 pb-4 md:pb-6 relative h-full w-full'>
                <div className='flex flex-col gap-4 md:gap-6 h-full w-full items-center'>
                    <Conversation className='w-full children-noscrollbar'>
                        <ConversationContent className='w-full md:w-4xl pt-12 mx-auto'>
                            {messages.map((message, messageIndex) => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    isLastMessage={messageIndex === messages.length - 1}
                                    isStreaming={isStreaming}
                                    onRegenerate={regenerate}
                                />
                            ))}
                            {status === 'submitted' && (
                                <div className='flex items-center gap-3'>
                                    <DataIsraelLoader size={18} />
                                    <LoadingShimmer />
                                </div>
                            )}
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
