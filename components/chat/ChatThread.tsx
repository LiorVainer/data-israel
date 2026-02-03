'use client';

import { type UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef } from 'react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { MessageItem } from '@/components/chat/MessageItem';
import { InputSection } from '@/components/chat/InputSection';
import { AgentConfig } from '@/agents/agent.config';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { INITIAL_MESSAGE_KEY, type InitialMessageData } from '@/constants/chat';

interface ChatThreadProps {
    id: string;
    initialMessages: UIMessage[];
}

export function ChatThread({ id, initialMessages }: ChatThreadProps) {
    const initialMessageSentRef = useRef(false);
    const defaultModel = AgentConfig.AVAILABLE_MODELS[0].id;

    const [initialMessageData, , removeInitialMessage] = useSessionStorage<InitialMessageData>(INITIAL_MESSAGE_KEY);

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat',
                prepareSendMessagesRequest({ messages }) {
                    return {
                        body: {
                            messages,
                            memory: {
                                thread: id,
                                resource: 'default-user',
                            },
                            model: defaultModel,
                        },
                    };
                },
            }),
        [id, defaultModel],
    );

    const { messages, sendMessage, status, regenerate, stop } = useChat({
        messages: initialMessages,
        transport,
    });

    // Send initial message from session storage
    useEffect(() => {
        console.log('[ChatThread] Effect triggered:', {
            initialMessageSentRef: initialMessageSentRef.current,
            initialMessageData,
            id,
        });

        if (initialMessageSentRef.current) {
            console.log('[ChatThread] Already sent, skipping');
            return;
        }
        if (!initialMessageData) {
            console.log('[ChatThread] No initial message data');
            return;
        }
        if (initialMessageData.chatId !== id) {
            console.log('[ChatThread] ChatId mismatch:', { expected: id, got: initialMessageData.chatId });
            return;
        }

        console.log('[ChatThread] Sending initial message:', initialMessageData.text);
        initialMessageSentRef.current = true;
        // Clear from session storage
        removeInitialMessage();
        // Send the message
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
