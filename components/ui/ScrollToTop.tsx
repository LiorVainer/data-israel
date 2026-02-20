'use client';

import { useEffect, useState, useCallback, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrollToTopProps {
    containerRef?: RefObject<HTMLElement | null>;
    threshold?: number;
}

export function ScrollToTop({ containerRef, threshold = 400 }: ScrollToTopProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = containerRef?.current;
        const target = el ?? window;

        const handleScroll = () => {
            const scrollTop = el ? el.scrollTop : window.scrollY;
            setVisible(scrollTop > threshold);
        };

        target.addEventListener('scroll', handleScroll, { passive: true });
        return () => target.removeEventListener('scroll', handleScroll);
    }, [containerRef, threshold]);

    const handleClick = useCallback(() => {
        const el = containerRef?.current;
        (el ?? window).scrollTo({ top: 0, behavior: 'smooth' });
    }, [containerRef]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className='fixed bottom-6 left-6 z-50'
                >
                    <Button
                        onClick={handleClick}
                        size='icon'
                        variant='outline'
                        className='rounded-full shadow-md'
                        type='button'
                    >
                        <ArrowUpIcon className='size-4' />
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
