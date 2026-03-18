'use client';

import { useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronDown, Github } from 'lucide-react';
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';
import { HeroSection } from '@/components/chat/HeroSection';
import { SourcesSection } from '@/components/landing/SourcesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { SiteNotices } from '@/components/SiteNotices';

export default function Home() {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();
    const glowSize = isMobile ? 400 : 800;
    const glowSizeSm = isMobile ? 350 : 700;

    const handleStartConversation = () => {
        const chatId = crypto.randomUUID();
        router.push(`/chat/${chatId}?new`);
    };

    const handleScrollToAbout = useCallback(() => {
        const aboutEl = document.getElementById('about');
        aboutEl?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    return (
        <div ref={scrollRef} className='h-full w-full overflow-y-auto overflow-x-clip'>
            <SiteNotices />

            <div className='relative flex min-h-dvh flex-col items-center justify-center px-4 md:px-0'>
                {/* GitHub link — top left corner */}
                <a
                    href='https://github.com/LiorVainer/data-israel'
                    target='_blank'
                    rel='noopener noreferrer'
                    dir='ltr'
                    className='absolute top-[16px] left-4 md:top-[20px] md:left-5 z-20 text-muted-foreground hover:text-foreground transition-colors'
                    aria-label='GitHub'
                >
                    <Github className='h-5 md:w-5' />
                </a>
                {/* Hero glows */}
                <AmbientGlow top='15%' left='15%' size={glowSize} />
                <AmbientGlow top='80%' left='85%' size={glowSize} />
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: 'easeInOut',
                    }}
                    className='relative z-10 flex flex-col gap-4 md:gap-6 w-full items-center justify-center'
                >
                    <HeroSection onStartConversation={handleStartConversation} onScrollToAbout={handleScrollToAbout} />
                </motion.div>

                {/* Stars background at the bottom of hero viewport */}
                <div className='pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[30vh] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_40%)]'>
                    <StarsBackground
                        className='h-full'
                        style={{ background: 'transparent' }}
                        speed={80}
                        factor={0.03}
                        starColor='oklch(0.55 0.18 250)'
                        pointerEvents={false}
                    />
                </div>

                {/* Beta label pinned to top of hero viewport */}
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className='absolute top-8 left-1/2 -translate-x-1/2 z-10 text-sm text-muted-foreground select-none'
                >
                    BETA
                </motion.span>

                {/* "Learn more" pinned to bottom of hero viewport */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    onClick={handleScrollToAbout}
                    className='absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                    <span>קראו עוד</span>
                    <ChevronDown className='w-4 h-4 animate-bounce' />
                </motion.button>
            </div>

            {/* Below-the-fold sections — reduced top padding for smooth hero→about flow */}
            <div className='z-10 flex flex-col pt-40 pb-16 md:pb-40 gap-32 md:gap-40 overflow-clip'>
                <div className='relative overflow-visible'>
                    <AmbientGlow top='30%' left='20%' size={glowSizeSm} />
                    <AboutSection />
                </div>

                {/* Full-bleed tinted band for Sources — gradient edges for smooth transition */}
                <div className='relative dark:via-muted/40 overflow-visible'>
                    <AmbientGlow top='20%' left='85%' size={glowSize} />
                    <AmbientGlow top='50%' left='40%' size={glowSize} />
                    <AmbientGlow top='70%' left='15%' size={glowSize} />
                    <SourcesSection />
                </div>

                <div className='relative overflow-visible'>
                    <AmbientGlow top='25%' left='75%' size={glowSizeSm} />
                    <AmbientGlow top='75%' left='20%' size={glowSizeSm} />
                    <HowItWorksSection />
                </div>

                <div className='relative overflow-visible'>
                    <AmbientGlow top='50%' left='50%' size={glowSizeSm} />
                    <ContactSection />
                </div>
            </div>

            <Footer />

            <ScrollToTop containerRef={scrollRef} />
        </div>
    );
}
