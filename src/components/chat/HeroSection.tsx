'use client';

import { motion } from 'framer-motion';
import { HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ui/logo';
import { CTAButton } from '@/components/cta-button';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

export function HeroSection({ onStartConversation }: HeroSectionProps) {
    const isMobile = useIsMobile();

    return (
        <div className='w-full max-w-4xl mx-auto text-center flex flex-col items-center justify-center gap-8 md:gap-12'>
            <motion.div
                className='flex flex-col gap-2 md:gap-4 items-center'
                variants={fadeUpVariants}
                initial='hidden'
                animate='visible'
            >
                <Logo width={isMobile ? 50 : 60} aria-label='DataGov Logo' />
                <h1 className='text-primary dark:text-logo-gradient-end font-bold md:text-lg'>דאטה ישראל</h1>
            </motion.div>
            <div className='flex-shrink-0 flex flex-col items-center gap-18 md:gap-16 4xl:gap-20'>
                <div className='flex flex-col gap-2'>
                    <HeroTitle line1='שואלים על ישראל.' line2='מקבלים נתונים רשמיים.' />
                    <div>
                        <HeroSubtitle>AI המחובר למאגרי מידע ציבוריים.</HeroSubtitle>
                        <HeroSubtitle>כל תשובה מבוססת על מקור רשמי.</HeroSubtitle>
                    </div>
                </div>
                <motion.div
                    className='flex flex-col sm:flex-row items-center gap-4'
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    {onStartConversation && (
                        <CTAButton onClick={onStartConversation}>
                            <span className='flex items-center font-bold gap-3 justify-between'>
                                התחילו לשאול
                                <ArrowLeft className='w-4 h-4' />
                            </span>
                        </CTAButton>
                    )}
                    <Button
                        variant='outline'
                        size='lg'
                        asChild
                        className='rounded-full px-9 py-3.5 h-auto font-bold text-base'
                    >
                        <a
                            href='https://www.bitpay.co.il/app/me/D7F8C813-B55F-C14F-C5D8-1381C6D038DDD06D'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            לתמיכה במיזם
                            <Heart className='w-4 h-4' />
                        </a>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
