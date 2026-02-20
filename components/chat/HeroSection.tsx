'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsTablet } from '@/hooks/use-mobile';
import { DATA_SOURCE_CONFIG } from '@/constants/tool-data-sources';
import { Logo } from '@/components/ui/logo';

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

export interface HeroSectionProps {}

export function HeroSection({}: HeroSectionProps) {
    const isTablet = useIsTablet();

    return (
        <div className='w-full max-w-4xl mx-auto px-4 pt-8 text-center flex flex-col items-center justify-center gap-10 md:gap-20'>
            <motion.div variants={fadeUpVariants} initial='hidden' animate='visible'>
                <Logo width={isTablet ? 80 : 150} aria-label='DataGov Logo' />
            </motion.div>
            <div className='flex-shrink-0 flex flex-col items-center gap-8 2xl:gap-16 4xl:gap-20'>
                <div className='flex flex-col gap-2'>
                    <HeroTitle line1='סוכן המידע הציבורי' line2='של ממשלת ישראל' />
                    <div>
                        <HeroSubtitle>חפש נתונים ציבוריים ממאגרי המידע</HeroSubtitle>
                        <HeroSubtitle>הרשמיים של ממשלת ישראל</HeroSubtitle>
                    </div>
                </div>
                <div className='flex items-center gap-8 md:gap-16 mt-3'>
                    <a
                        href={DATA_SOURCE_CONFIG.datagov.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:opacity-70 transition-opacity'
                    >
                        <Image
                            src='/datagov-logo.svg'
                            alt='data.gov.il'
                            width={isTablet ? 85 : 130}
                            height={isTablet ? 45 : 60}
                        />
                    </a>
                    <a
                        href={DATA_SOURCE_CONFIG.cbs.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:opacity-70 transition-opacity'
                    >
                        <Image
                            src='/cbs-logo.svg'
                            alt='הלמ"ס'
                            width={isTablet ? 90 : 130}
                            height={isTablet ? 50 : 70}
                        />
                    </a>
                </div>
            </div>
        </div>
    );
}
