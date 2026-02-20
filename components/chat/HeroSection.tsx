'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageSquareText } from 'lucide-react';
import { HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsTablet } from '@/hooks/use-mobile';
import { DATA_SOURCE_CONFIG } from '@/constants/tool-data-sources';
import { Logo } from '@/components/ui/logo';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';

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
    const isTablet = useIsTablet();

    return (
        <div className='w-full max-w-4xl mx-auto pt-8 text-center flex flex-col items-center justify-center gap-10 md:gap-20'>
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
                <div className='flex items-center gap-8 md:gap-16'>
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
                {onStartConversation && (
                    <div className='flex flex-col items-center gap-3 mt-6'>
                        <motion.button
                            onClick={onStartConversation}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className='inline-flex items-center gap-2.5 rounded-full bg-action px-8 py-3.5 text-base font-semibold text-background transition-colors hover:bg-action/90 cursor-pointer'
                        >
                            <MessageSquareText className='w-5 h-5' />
                            התחל שיחה חדשה
                        </motion.button>
                        <AiDisclaimer />
                    </div>
                )}
            </div>
        </div>
    );
}
