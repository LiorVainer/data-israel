'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/chat/HeroSection';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { StatsSection } from '@/components/landing/StatsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ExampleOutputsSection } from '@/components/landing/ExampleOutputsSection';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
    const router = useRouter();

    const handleStartConversation = () => {
        const chatId = crypto.randomUUID();
        router.push(`/chat/${chatId}`);
    };

    return (
        <div className='relative h-full w-full overflow-y-auto'>
            <GeometricBackground />

            {/* Hero Section */}
            <div className='relative z-10 mx-auto px-4 md:px-0 pt-8 md:pt-12 pb-16 md:pb-24'>
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
                    <HeroSection onStartConversation={handleStartConversation} />
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
