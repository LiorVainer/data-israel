'use client';

import { motion } from 'framer-motion';
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import {
    PromptInput,
    PromptInputFooter,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { LandingPage } from '@/components/chat/LandingPage';
import { MessageItem } from '@/components/chat/MessageItem';
import { ModelSelectorSection } from '@/components/chat/ModelSelectorSection';
import { AgentConfig } from '@/agents/agent.config';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { useIsMobile } from '@/hooks/use-mobile';
import { Suggestions } from '@/components/chat/Suggestions';

export default function Home() {
    const [selectedModel, setSelectedModel] = useState(AgentConfig.AVAILABLE_MODELS[0].id);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const modelRef = useRef(selectedModel);

    // Keep modelRef in sync with selectedModel for use in callbacks
    useEffect(() => {
        modelRef.current = selectedModel;
    }, [selectedModel]);

    const { messages, sendMessage, status, regenerate, stop } = useChat();

    console.log({ messages });
    const isMobile = useIsMobile();

    const handleSuggestionClick = (prompt: string) => {
        void sendMessage({ text: prompt });
    };

    console.log({ status });
    const isStreaming = status === 'submitted' || status === 'streaming';
    const hasMessages = messages.length > 0;

    return (
        <div className='relative h-dvh w-screen'>
            <GeometricBackground />

            <div className='mx-auto px-4 md:px-0 pb-4 md:pb-6 relative h-full w'>
                <motion.div
                    initial={{ opacity: 0.0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: 'easeInOut',
                    }}
                    className='flex flex-col gap-4 md:gap-6 h-full w-full items-center'
                >
                    {hasMessages ? (
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
                    ) : null}

                    {!hasMessages && (
                        <div className='relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden'>
                            <LandingPage onSuggestionClick={handleSuggestionClick} />
                        </div>
                    )}

                    <div className='relative z-20 w-full md:w-4xl'>
                        {!hasMessages && (
                            <div className='mb-3'>
                                <Suggestions onClick={handleSuggestionClick} />
                            </div>
                        )}
                        <PromptInput
                            onSubmit={(message) => {
                                if (!message.text.trim()) return;
                                void sendMessage({ text: message.text }, { body: { model: modelRef.current } });
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
                </motion.div>
            </div>
        </div>
    );
}
