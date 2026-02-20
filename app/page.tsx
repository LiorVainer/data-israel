'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/chat/HeroSection';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { Suggestions } from '@/components/chat/Suggestions';
import { InputSection } from '@/components/chat/InputSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ExampleOutputsSection } from '@/components/landing/ExampleOutputsSection';
import { Footer } from '@/components/landing/Footer';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { INITIAL_MESSAGE_KEY, type InitialMessageData } from '@/constants/chat';

export default function Home() {
    const router = useRouter();
    const [, setInitialMessage] = useSessionStorage<InitialMessageData>(INITIAL_MESSAGE_KEY);

    const handleSend = (text: string) => {
        if (!text.trim()) return;

        const chatId = crypto.randomUUID();

        const messageData = {
            chatId,
            text,
        };

        // Save initial message to session storage
        setInitialMessage(messageData);

        // Navigate to chat page
        router.push(`/chat/${chatId}`);
    };

    return (
        <div className='relative h-full w-full flex flex-col'>
            <GeometricBackground />

            {/* Scrollable content area */}
            <div className='relative z-10 flex-1 min-h-0 overflow-y-auto'>
                {/* Hero */}
                <div className='mx-auto px-4 md:px-0 pt-8 md:pt-12'>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.3,
                            duration: 0.8,
                            ease: 'easeInOut',
                        }}
                        className='flex flex-col gap-4 md:gap-6 w-full items-center justify-center'
                    >
                        <HeroSection />
                    </motion.div>
                </div>

                {/* Below-the-fold sections */}
                <div className='flex flex-col gap-16 md:gap-24 py-12 md:py-20'>
                    <StatsSection />
                    <HowItWorksSection />
                    <ExampleOutputsSection />
                </div>

                <Footer />
            </div>

            {/* Input pinned to bottom */}
            <div className='relative z-20 w-full border-t border-border/40 bg-background px-4 md:px-0 pt-3 pb-4 md:pb-6'>
                <div className='w-full max-w-3xl mx-auto'>
                    <div className='mb-3'>
                        <Suggestions onClick={handleSend} />
                    </div>
                    <InputSection onSubmit={handleSend} />
                </div>
            </div>
        </div>
    );
}
