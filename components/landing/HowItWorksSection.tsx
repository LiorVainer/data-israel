'use client';

import { motion } from 'framer-motion';
import { MessageSquareText, Search, FileChartColumn } from 'lucide-react';
import type { ReactNode } from 'react';

interface StepProps {
    icon: ReactNode;
    title: string;
    description: string;
    delay: number;
}

function Step({ icon, title, description, delay }: StepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className='flex flex-col items-center gap-4 text-center'
        >
            <div className='flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary'>
                {icon}
            </div>
            <h3 className='text-lg font-semibold text-foreground'>{title}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed max-w-[280px]'>{description}</p>
        </motion.div>
    );
}

const STEPS = [
    {
        icon: <MessageSquareText className='w-7 h-7' />,
        title: 'שאלו שאלה',
        description: 'כתבו שאלה בעברית על נתונים ציבוריים — מחירים, דמוגרפיה, תחבורה ועוד',
    },
    {
        icon: <Search className='w-7 h-7' />,
        title: 'הסוכן חוקר',
        description: 'הסוכן מחפש במאגרי data.gov.il והלמ"ס, מסנן ומנתח את המידע הרלוונטי',
    },
    {
        icon: <FileChartColumn className='w-7 h-7' />,
        title: 'תוצאות מדויקות',
        description: 'מקבלים תשובה מבוססת נתונים עם גרפים, טבלאות וקישורים למקורות הרשמיים',
    },
] as const;

export function HowItWorksSection() {
    return (
        <section className='w-full max-w-4xl mx-auto px-4'>
            <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className='text-2xl md:text-3xl font-bold text-center text-foreground mb-10'
            >
                איך זה עובד?
            </motion.h2>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8'>
                {STEPS.map((step, i) => (
                    <Step
                        key={step.title}
                        icon={step.icon}
                        title={step.title}
                        description={step.description}
                        delay={i * 0.15}
                    />
                ))}
            </div>
        </section>
    );
}
