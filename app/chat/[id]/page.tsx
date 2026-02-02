'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import {
    PromptInput,
    PromptInputFooter,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { MessageItem } from '@/components/chat/MessageItem';
import { ModelSelectorSection } from '@/components/chat/ModelSelectorSection';
import { AgentConfig } from '@/agents/agent.config';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';

export default function ChatPage() {
    const { id } = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [selectedModel, setSelectedModel] = useState(AgentConfig.AVAILABLE_MODELS[0].id);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const modelRef = useRef(selectedModel);
    const initialMessageSent = useRef(false);

    // Keep modelRef in sync with selectedModel for use in callbacks
    useEffect(() => {
        modelRef.current = selectedModel;
    }, [selectedModel]);

    const { messages, sendMessage, status, regenerate, stop } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest({ messages }) {
                return {
                    body: {
                        messages,
                        memory: {
                            thread: id,
                            resource: 'default-user',
                        },
                        model: modelRef.current,
                    },
                };
            },
        }),
    });

    // Auto-send initial message from ?q= param
    const handleInitialMessage = useCallback(() => {
        const initialQuery = searchParams.get('q');
        if (initialQuery && !initialMessageSent.current) {
            initialMessageSent.current = true;
            void sendMessage({ text: initialQuery });
            router.replace(`/chat/${id}`);
        }
    }, [searchParams, sendMessage, router, id]);

    useEffect(() => {
        handleInitialMessage();
    }, [handleInitialMessage]);

    const isStreaming = status === 'submitted' || status === 'streaming';

    return (
        <div className='relative h-dvh w-screen'>
            <GeometricBackground />

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
                        <PromptInput
                            onSubmit={(message) => {
                                if (!message.text.trim()) return;
                                void sendMessage({ text: message.text });
                            }}
                        >
                            <PromptInputTextarea placeholder='שאל על מאגרי מידע' />
                            <PromptInputFooter>
                                <PromptInputTools>
                                    <ModelSelectorSection
                                        selectedModel={selectedModel}
                                        open={modelSelectorOpen}
                                        onOpenChange={setModelSelectorOpen}
                                        onSelectModel={setSelectedModel}
                                    />
                                </PromptInputTools>
                                <PromptInputSubmit
                                    status={status}
                                    onClick={status === 'streaming' ? stop : undefined}
                                />
                            </PromptInputFooter>
                        </PromptInput>
                    </div>
                </div>
            </div>
        </div>
    );
}
