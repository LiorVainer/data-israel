'use client';

import { motion } from 'framer-motion';
import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputTools,
    PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { EmptyConversation } from '@/components/chat/EmptyConversation';
import { MessageItem } from '@/components/chat/MessageItem';
import { ModelSelectorSection } from '@/components/chat/ModelSelectorSection';
import type { DataAgentUIMessage } from '@/agents/data-agent';
import { AgentConfig } from '@/agents/agent.config';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';

export default function Home() {
    const [selectedModel, setSelectedModel] = useState(AgentConfig.AVAILABLE_MODELS[0].id);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const modelRef = useRef(selectedModel);

    // Keep modelRef in sync with selectedModel for use in callbacks
    useEffect(() => {
        modelRef.current = selectedModel;
    }, [selectedModel]);

    const { messages, sendMessage, status, regenerate, stop } = useChat<DataAgentUIMessage>();

    const handleSuggestionClick = (prompt: string) => {
        void sendMessage({ text: prompt }, { body: { model: modelRef.current } });
    };

    const isStreaming = status === 'submitted' || status === 'streaming';
    const hasMessages = messages.length > 0;

    return (
        <div className='relative h-dvh'>
            {!hasMessages ? <GeometricBackground /> : null}

            <div className='max-w-4xl mx-auto p-4 md:p-6 relative h-full'>
                <motion.div
                    initial={{ opacity: 0.0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: 'easeInOut',
                    }}
                    className='flex flex-col h-full gap-4 md:gap-6'
                >
                    {hasMessages ? (
                        <Conversation className='h-full flex-1'>
                            <ConversationContent>
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
                            <EmptyConversation onSuggestionClick={handleSuggestionClick} />
                        </div>
                    )}

                    <div className='relative z-20'>
                        <PromptInput
                            className={hasMessages ? 'mt-4' : ''}
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
