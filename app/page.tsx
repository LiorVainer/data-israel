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

            {/* Hero + Input Section */}
            <div className='relative z-10 mx-auto px-4 md:px-0 pb-4 md:pb-6'>
                <motion.div
                    initial={{ opacity: 0.0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: 'easeInOut',
                    }}
                    className='flex flex-col gap-4 md:gap-6 w-full items-center min-h-[80dvh] justify-center'
                >
                    <div className='relative z-20 flex flex-col'>
                        <HeroSection />
                    </div>

                    <div className='relative z-20 w-full md:w-4xl'>
                        <div className='mb-3'>
                            <Suggestions onClick={handleSend} />
                        </div>
                        <InputSection onSubmit={handleSend} />
                    </div>
                </motion.div>
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
