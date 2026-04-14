'use client';

import { motion } from 'framer-motion';
import { HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DonateDialog } from '@/components/landing/DonateDialog';

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
                className='relative flex flex-col gap-2 md:gap-4 items-center'
                variants={fadeUpVariants}
                initial='hidden'
                animate='visible'
            >
                <Logo width={isMobile ? 50 : 60} aria-label='DataGov Logo' />
                <h1 className='text-primary dark:text-logo-gradient-end font-bold md:text-lg'>דאטה ישראל</h1>
            </motion.div>
            <div className='flex-shrink-0 flex flex-col items-center gap-8 md:gap-16 4xl:gap-20'>
                <div className='flex flex-col gap-2 items-center'>
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
                        <Button
                            onClick={onStartConversation}
                            className='min-w-52 md:min-w-52 gap-3 rounded-full px-6 py-2.5 md:px-9 md:py-2.5 h-auto text-sm md:text-base'
                        >
                            התחילו לשאול
                            <ArrowLeft className='w-4 h-4' />
                        </Button>
                    )}
                    <DonateDialog>
                        <Button
                            variant='outline'
                            size='lg'
                            className='min-w-52 md:min-w-52 gap-3 rounded-full px-6 py-2.5 md:px-9 md:py-2.5 h-auto text-sm md:text-base'
                        >
                            לתמיכה במיזם
                            {/*<Heart className='w-4 h-4 fill-background/80 dark:fill-background text-foreground/80 dark:text-foreground font-normal' />*/}
                        </Button>
                    </DonateDialog>
                </motion.div>
            </div>
        </div>
    );
}
