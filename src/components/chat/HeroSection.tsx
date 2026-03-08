'use client';

import { motion } from 'framer-motion';
import { HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ui/logo';
import { CTAButton } from '@/components/cta-button';
import { ArrowLeft } from 'lucide-react';

const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            delay: 0.3,
            ease: [0.25, 0.4, 0.25, 1] as const,
        },
    },
};

export interface HeroSectionProps {
    onStartConversation?: () => void;
    onScrollToAbout?: () => void;
}

export function HeroSection({ onStartConversation, onScrollToAbout }: HeroSectionProps) {
    const isMobile = useIsMobile();

    return (
        <div className='w-full max-w-4xl mx-auto text-center flex flex-col items-center justify-center gap-10 md:gap-16'>
            <motion.div
                className='flex flex-col gap-2 md:gap-4 items-center'
                variants={fadeUpVariants}
                initial='hidden'
                animate='visible'
            >
                <Logo width={isMobile ? 80 : 130} aria-label='DataGov Logo' />
                <h1 className='text-primary dark:text-logo-gradient-end font-bold text-xl md:text-2xl'>דאטה ישראל</h1>
            </motion.div>
            <div className='flex-shrink-0 flex flex-col items-center gap-16 md:gap-24 4xl:gap-20'>
                <div className='flex flex-col gap-2'>
                    <HeroTitle line1='שואלים על ישראל.' line2='מקבלים נתונים רשמיים.' />
                    <div>
                        <HeroSubtitle>AI המחובר למאגרי מידע ציבוריים.</HeroSubtitle>
                        <HeroSubtitle>כל תשובה מבוססת על מקור רשמי.</HeroSubtitle>
                    </div>
                </div>
                {onStartConversation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                    >
                        <CTAButton onClick={onStartConversation}>
                            <span className='flex items-center font-bold gap-3 justify-between'>
                                התחילו לשאול
                                <ArrowLeft className='w-4 h-4' />
                            </span>
                        </CTAButton>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
