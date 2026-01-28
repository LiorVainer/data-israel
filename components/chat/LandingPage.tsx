'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { PromptSuggestions } from './PromptSuggestions';
import { HeroBadge, HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsMobile } from '@/hooks/use-mobile';

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

export interface LandingPageProps {
    onSuggestionClick: (prompt: string) => void;
}

export function LandingPage({ onSuggestionClick }: LandingPageProps) {
    const isMobile = useIsMobile();

    return (
        <div className='w-full max-w-4xl mx-auto px-4 text-center flex flex-col items-center justify-center flex-1 min-h-0 gap-4 md:gap-8'>
            <motion.div variants={fadeUpVariants} initial='hidden' animate='visible'>
                <Image src='/data-israel.png' alt='DataGov Logo' width={150} height={50} priority />
            </motion.div>
            <div className='flex-shrink-0 flex flex-col items-center gap-4'>
                <HeroTitle line1='חפש מידע ציבורי' line2='ממאגרי הממשלה' />
                <div>
                    <HeroSubtitle>חפש מאגרי מידע ונתונים ציבוריים</HeroSubtitle>
                    <HeroSubtitle>מהמאגר הרשמי של ממשלת ישראל</HeroSubtitle>
                </div>
                <HeroBadge>data.gov.il</HeroBadge>
            </div>

            {!isMobile && (
                <div className='w-full min-h-32 overflow-y-auto mt-4 flex flex-col items-center'>
                    <div className='text-muted-foreground font-medium mb-3 text-center flex-shrink-0'>
                        דוגמאות לשאלות:
                    </div>
                    <PromptSuggestions onSuggestionClick={onSuggestionClick} />
                </div>
            )}
        </div>
    );
}
