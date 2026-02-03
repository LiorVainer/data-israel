'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            delay: 0.5 + i * 0.2,
            ease: [0.25, 0.4, 0.25, 1] as const,
        },
    }),
};

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = 'from-primary/10',
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn('absolute', className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                }}
                style={{
                    width,
                    height,
                }}
                className='relative'
            >
                <div
                    className={cn(
                        'absolute inset-0 rounded-full',
                        'bg-gradient-to-r to-transparent',
                        gradient,
                        'backdrop-blur-[2px] border-2 border-primary/15',
                        'shadow-[0_8px_32px_0_rgba(var(--primary),0.1)]',
                        'after:absolute after:inset-0 after:rounded-full',
                        'after:bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.2),transparent_70%)]',
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

function GeometricBackground({ children, noShapes }: { children?: React.ReactNode; noShapes?: boolean }) {
    return (
        <div className='absolute inset-0 overflow-hidden bg-background'>
            <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 blur-3xl' />

            {!noShapes && (
                <div className='absolute inset-0 overflow-hidden'>
                    <ElegantShape
                        delay={0.3}
                        width={600}
                        height={140}
                        rotate={12}
                        gradient='from-primary/15'
                        className='left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]'
                    />

                    <ElegantShape
                        delay={0.5}
                        width={500}
                        height={120}
                        rotate={-15}
                        gradient='from-accent/15'
                        className='right-[-5%] md:right-[0%] top-[70%] md:top-[75%]'
                    />

                    <ElegantShape
                        delay={0.4}
                        width={300}
                        height={80}
                        rotate={-8}
                        gradient='from-primary/20'
                        className='left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]'
                    />

                    <ElegantShape
                        delay={0.6}
                        width={200}
                        height={60}
                        rotate={20}
                        gradient='from-accent/20'
                        className='right-[15%] md:right-[20%] top-[10%] md:top-[15%]'
                    />

                    <ElegantShape
                        delay={0.7}
                        width={150}
                        height={40}
                        rotate={-25}
                        gradient='from-primary/10'
                        className='left-[20%] md:left-[25%] top-[5%] md:top-[10%]'
                    />
                </div>
            )}

            <div className='absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none' />

            {children}
        </div>
    );
}

function HeroBadge({
    children,
    delay = 0,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            custom={delay}
            variants={fadeUpVariants}
            initial='hidden'
            animate='visible'
            className={cn(
                'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10',
                className,
            )}
        >
            <span className='text-sm tracking-wide'>{children}</span>
        </motion.div>
    );
}

function HeroTitle({ line1, line2, delay = 1 }: { line1: string; line2: string; delay?: number }) {
    return (
        <motion.div custom={delay} variants={fadeUpVariants} initial='hidden' animate='visible'>
            <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 tracking-tight'>
                <span className='bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/80'>
                    {line1}
                </span>
                <br />
                <span className='bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground/90 to-accent'>
                    {line2}
                </span>
            </h1>
        </motion.div>
    );
}

function HeroSubtitle({ children, delay = 2 }: { children: React.ReactNode; delay?: number }) {
    return (
        <motion.div custom={delay} variants={fadeUpVariants} initial='hidden' animate='visible'>
            <p className='text-base sm:text-lg text-muted-foreground leading-relaxed font-light tracking-wide max-w-xl mx-auto'>
                {children}
            </p>
        </motion.div>
    );
}

export { GeometricBackground, HeroBadge, HeroTitle, HeroSubtitle };
