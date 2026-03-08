'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface ExampleCardProps {
    title: string;
    imageSrc?: string;
    delay: number;
}

function ExampleCard({ title, imageSrc, delay }: ExampleCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className='flex flex-col rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden'
        >
            <div className='relative w-full aspect-[16/10] bg-muted/30'>
                {imageSrc ? (
                    <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        className='object-cover'
                        sizes='(max-width: 768px) 100vw, 33vw'
                    />
                ) : (
                    <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground/40'>
                        <ImageIcon className='w-10 h-10' />
                        <span className='text-xs'>תמונה תתווסף בקרוב</span>
                    </div>
                )}
            </div>
            <div className='px-4 py-3'>
                <p className='text-sm font-medium text-foreground text-center'>{title}</p>
            </div>
        </motion.div>
    );
}

const EXAMPLES = [
    {
        title: 'ניתוח מגמות מחירים עם גרפים',
        imageSrc: undefined,
    },
    {
        title: 'חיפוש מאגרי מידע ממשלתיים',
        imageSrc: undefined,
    },
    {
        title: 'השוואת נתונים סטטיסטיים',
        imageSrc: undefined,
    },
] as const;

export function ExampleOutputsSection() {
    return (
        <section className='w-full max-w-4xl mx-auto px-4'>
            <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className='text-2xl md:text-3xl font-bold text-center text-foreground mb-10'
            >
                דוגמאות לתוצאות
            </motion.h2>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'>
                {EXAMPLES.map((example, i) => (
                    <ExampleCard
                        key={example.title}
                        title={example.title}
                        imageSrc={example.imageSrc}
                        delay={i * 0.1}
                    />
                ))}
            </div>
        </section>
    );
}
