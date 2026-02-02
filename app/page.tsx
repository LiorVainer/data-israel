'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    PromptInput,
    PromptInputFooter,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { LandingPage } from '@/components/chat/LandingPage';
import { ModelSelectorSection } from '@/components/chat/ModelSelectorSection';
import { AgentConfig } from '@/agents/agent.config';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { Suggestions } from '@/components/chat/Suggestions';

export default function Home() {
    const router = useRouter();
    const [selectedModel, setSelectedModel] = useState(AgentConfig.AVAILABLE_MODELS[0].id);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

    const navigateToChat = (message: string) => {
        const chatId = crypto.randomUUID();
        router.push(`/chat/${chatId}?q=${encodeURIComponent(message)}`);
    };

    const handleSuggestionClick = (prompt: string) => {
        navigateToChat(prompt);
    };

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
                    <div className='relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden'>
                        <LandingPage onSuggestionClick={handleSuggestionClick} />
                    </div>

                    <div className='relative z-20 w-full md:w-4xl'>
                        <div className='mb-3'>
                            <Suggestions onClick={handleSuggestionClick} />
                        </div>
                        <PromptInput
                            onSubmit={(message) => {
                                if (!message.text.trim()) return;
                                navigateToChat(message.text);
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
                                <PromptInputSubmit />
                            </PromptInputFooter>
                        </PromptInput>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
