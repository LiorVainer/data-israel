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
        <div className='relative min-h-full w-full overflow-y-auto'>
            <GeometricBackground />

            {/* Hero Section — scrolls with page */}
            <div className='relative z-10 mx-auto px-4 md:px-0 pt-8 md:pt-12 pb-32 md:pb-36'>
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

            {/* Sticky Input + Suggestions — stays visible on scroll */}
            <div className='sticky bottom-0 z-30 w-full bg-gradient-to-t from-background via-background/95 to-background/0 pt-6 pb-4 md:pb-6 px-4 md:px-0'>
                <div className='w-full max-w-3xl mx-auto'>
                    <div className='mb-3'>
                        <Suggestions onClick={handleSend} />
                    </div>
                    <InputSection onSubmit={handleSend} />
                </div>
            </div>

            {/* Below-the-fold sections */}
            <div className='relative z-10 flex flex-col gap-16 md:gap-24 py-12 md:py-20'>
                <StatsSection />
                <HowItWorksSection />
                <ExampleOutputsSection />
            </div>

            <div className='relative z-10'>
                <Footer />
            </div>
        </div>
    );
}
