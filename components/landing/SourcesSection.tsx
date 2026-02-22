'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BarChart3, Building2, Calendar, Database, FolderOpen, Layers } from 'lucide-react';
import type { ReactNode } from 'react';
import { DATA_SOURCE_CONFIG } from '@/constants/tool-data-sources';

interface StatProps {
    icon: ReactNode;
    value: string;
    label: string;
}

function StatCard({ icon, value, label }: StatProps) {
    return (
        <div className='flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm px-6 py-8'>
            <div className='flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary'>
                {icon}
            </div>
            <span className='text-3xl md:text-4xl font-bold text-foreground tabular-nums'>{value}</span>
            <span className='text-sm md:text-base text-muted-foreground text-center'>{label}</span>
        </div>
    );
}

interface SourceBlockProps {
    href: string;
    logoSrc: string;
    logoAlt: string;
    logoWidth: number;
    logoHeight: number;
    description: string;
    stats: StatProps[];
    delay: number;
}

function SourceBlock({ href, logoSrc, logoAlt, logoWidth, logoHeight, description, stats, delay }: SourceBlockProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className='flex flex-col items-center gap-12'
        >
            <div className='flex flex-col items-center gap-6 w-full'>
                <a
                    href={href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:opacity-70 transition-opacity'
                >
                    <Image src={logoSrc} alt={logoAlt} width={logoWidth} height={logoHeight} />
                </a>
                <p className='text-sm md:text-base text-muted-foreground text-center leading-relaxed max-w-md'>
                    {description}
                </p>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 w-full'>
                {stats.map((stat) => (
                    <StatCard key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
                ))}
            </div>
        </motion.div>
    );
}

export function SourcesSection() {
    return (
        <section className='w-full max-w-4xl mx-auto px-4 flex flex-col gap-8 md:gap-16'>
            <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className='text-2xl md:text-3xl font-bold text-center text-foreground'
            >
                מקורות המידע
            </motion.h2>

            <div className='flex flex-col gap-16 md:gap-24'>
                <SourceBlock
                    href={DATA_SOURCE_CONFIG.datagov.url}
                    logoSrc='/datagov-logo.svg'
                    logoAlt='data.gov.il'
                    logoWidth={150}
                    logoHeight={65}
                    description='הפורטל הלאומי לנתונים פתוחים של ממשלת ישראל —
מאגרי מידע ממשרדי ממשלה, רשויות וגופים ציבוריים.'
                    delay={0}
                    stats={[
                        { icon: <Database className='w-6 h-6' />, value: '15,000+', label: 'מאגרי מידע' },
                        { icon: <Building2 className='w-6 h-6' />, value: '100+', label: 'גופים מפרסמים' },
                        { icon: <FolderOpen className='w-6 h-6' />, value: '50,000+', label: 'קבצי נתונים' },
                    ]}
                />

                <SourceBlock
                    href={DATA_SOURCE_CONFIG.cbs.url}
                    logoSrc='/cbs-logo.svg'
                    logoAlt='הלמ"ס'
                    logoWidth={150}
                    logoHeight={75}
                    description='הגוף הרשמי לסטטיסטיקה של מדינת ישראל —
מדדי מחירים, דמוגרפיה, נתוני יישובים ועוד.'
                    delay={0.15}
                    stats={[
                        { icon: <BarChart3 className='w-6 h-6' />, value: '1,000+', label: 'סדרות סטטיסטיות' },
                        { icon: <Layers className='w-6 h-6' />, value: '50+', label: 'תחומי מידע' },
                        { icon: <Calendar className='w-6 h-6' />, value: '75+', label: 'שנות נתונים' },
                    ]}
                />
            </div>
        </section>
    );
}
