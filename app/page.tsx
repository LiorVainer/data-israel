'use client';

import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/chat/HeroSection';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { SourcesSection } from '@/components/landing/SourcesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { Footer } from '@/components/landing/Footer';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

export default function Home() {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleStartConversation = () => {
        const chatId = crypto.randomUUID();
        router.push(`/chat/${chatId}?new`);
    };

    const handleScrollToAbout = useCallback(() => {
        const aboutEl = document.getElementById('about');
        aboutEl?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    return (
        <div ref={scrollRef} className='relative h-full w-full overflow-y-auto'>
            <GeometricBackground />

            {/* Hero Section — centered within first viewport */}
            <div className='relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 md:px-0'>
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
                    <HeroSection
                        onStartConversation={handleStartConversation}
                        onScrollToAbout={handleScrollToAbout}
                    />
                </motion.div>
            </div>

            {/* Below-the-fold sections */}
            <div className='relative z-10 flex flex-col gap-16 md:gap-48 py-12 md:py-36'>
                <AboutSection />
                <SourcesSection />
                <HowItWorksSection />
            </div>

            <div className='relative z-10'>
                <Footer />
            </div>

            <ScrollToTop containerRef={scrollRef} />
        </div>
    );
}
