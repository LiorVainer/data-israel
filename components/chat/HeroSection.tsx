'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeroBadge, HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsMobile } from '@/hooks/use-mobile';
import { DATA_SOURCE_CONFIG } from '../../constants/tool-data-sources';

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
    onSuggestionClick: (prompt: string) => void;
}

export function HeroSection({ onSuggestionClick }: HeroSectionProps) {
    const isMobile = useIsMobile();

    return (
        <div className='w-full max-w-4xl mx-auto px-4 pt-8 text-center flex flex-col items-center justify-center flex-1 min-h-0 gap-4 md:gap-8'>
            <motion.div variants={fadeUpVariants} initial='hidden' animate='visible'>
                <Image
                    src='/data-israel.svg'
                    alt='DataGov Logo'
                    width={isMobile ? 100 : 150}
                    height={isMobile ? 33 : 50}
                    priority
                />
            </motion.div>
            <div className='flex-shrink-0 flex flex-col items-center gap-4'>
                <HeroTitle line1='חפש מידע ציבורי' line2='ממאגרי הממשלה' />
                <div>
                    <HeroSubtitle>חפש נתונים ציבוריים ממאגרי המידע</HeroSubtitle>
                    <HeroSubtitle>הרשמיים של ממשלת ישראל</HeroSubtitle>
                </div>
                <div className='flex items-center gap-2 mt-3'>
                    <a href={DATA_SOURCE_CONFIG.datagov.url} target='_blank' rel='noopener noreferrer'>
                        <HeroBadge className='bg-badge-datagov/20 border-badge-datagov text-badge-datagov-foreground hover:opacity-80 transition-opacity cursor-pointer'>
                            {DATA_SOURCE_CONFIG.datagov.urlLabel}
                        </HeroBadge>
                    </a>
                    <a href={DATA_SOURCE_CONFIG.cbs.url} target='_blank' rel='noopener noreferrer'>
                        <HeroBadge className='bg-badge-cbs/20 border-badge-cbs text-badge-cbs-foreground hover:opacity-80 transition-opacity cursor-pointer'>
                            {DATA_SOURCE_CONFIG.cbs.urlLabel}
                        </HeroBadge>
                    </a>
                </div>
            </div>
        </div>
    );
}
