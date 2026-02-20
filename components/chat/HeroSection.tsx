'use client';

import { motion } from 'framer-motion';
import { HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsTablet } from '@/hooks/use-mobile';
import { Logo } from '@/components/ui/logo';
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
    onScrollToAbout?: () => void;
}

export function HeroSection({ onStartConversation, onScrollToAbout }: HeroSectionProps) {
    const isTablet = useIsTablet();

    return (
        <div className='w-full max-w-4xl mx-auto text-center flex flex-col items-center justify-center gap-10 md:gap-20'>
            <motion.div variants={fadeUpVariants} initial='hidden' animate='visible'>
                <Logo width={isTablet ? 80 : 150} aria-label='DataGov Logo' />
            </motion.div>
            <div className='flex-shrink-0 flex flex-col items-center gap-16 md:gap-24 4xl:gap-20'>
                <div className='flex flex-col gap-2'>
                    <HeroTitle line1='סוכני המידע הציבורי' line2='של ממשלת ישראל' />
                    <div>
                        <HeroSubtitle>חפש נתונים ציבוריים ממאגרי המידע</HeroSubtitle>
                        <HeroSubtitle>הרשמיים של ממשלת ישראל</HeroSubtitle>
                    </div>
                </div>
                {onStartConversation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className='flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto'
                    >
                        <Button
                            size='lg'
                            onClick={onStartConversation}
                            className='w-full sm:w-48 rounded-full bg-action px-10 py-4 text-base font-semibold text-background hover:bg-action/90'
                        >
                            התחל שיחה חדשה
                        </Button>
                        <Button
                            size='lg'
                            variant='outline'
                            onClick={onScrollToAbout}
                            className='w-full sm:w-48 rounded-full px-10 py-4 text-base font-semibold'
                        >
                            מי אנחנו?
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
