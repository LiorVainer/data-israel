'use client';

import { motion } from 'framer-motion';
import { Database, Building2, BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
    icon: ReactNode;
    value: string;
    label: string;
    delay: number;
}

function StatCard({ icon, value, label, delay }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className='flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm px-6 py-8'
        >
            <div className='flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary'>
                {icon}
            </div>
            <span className='text-3xl md:text-4xl font-bold text-foreground tabular-nums'>{value}</span>
            <span className='text-sm md:text-base text-muted-foreground text-center'>{label}</span>
        </motion.div>
    );
}

const STATS = [
    {
        icon: <Database className='w-6 h-6' />,
        value: '15,000+',
        label: 'מאגרי מידע ממשלתיים',
    },
    {
        icon: <Building2 className='w-6 h-6' />,
        value: '100+',
        label: 'משרדי ממשלה וגופים ציבוריים',
    },
    {
        icon: <BarChart3 className='w-6 h-6' />,
        value: '2',
        label: 'מקורות מידע רשמיים',
    },
] as const;

export function StatsSection() {
    return (
        <section className='w-full max-w-4xl mx-auto px-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'>
                {STATS.map((stat, i) => (
                    <StatCard key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} delay={i * 0.1} />
                ))}
            </div>
        </section>
    );
}
