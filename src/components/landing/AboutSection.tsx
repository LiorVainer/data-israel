'use client';

import { motion } from 'framer-motion';
import { BarChart3, Globe, Map, MessageSquareText, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';

interface FeatureProps {
    icon: ReactNode;
    title: string;
    description: string;
    delay: number;
}

function Feature({ icon, title, description, delay }: FeatureProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className='group relative flex flex-col items-center gap-3 text-center rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6 transition-colors hover:border-primary/20 hover:bg-card/80'
        >
            <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-primary-tint text-primary'>
                {icon}
            </div>
            <h3 className='text-base font-semibold text-foreground'>{title}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>{description}</p>
        </motion.div>
    );
}

const FEATURES = [
    {
        icon: <MessageSquareText className='w-6 h-6' />,
        title: 'שאלות בעברית',
        description: 'שאלו כל שאלה בעברית וקבלו תשובה ברורה — בלי לחפש בטבלאות או להוריד קבצים',
    },
    {
        icon: <ShieldCheck className='w-6 h-6' />,
        title: 'מידע אמיתי בלבד',
        description: 'כל תשובה מבוססת על נתונים רשמיים ממאגרים ממשלתיים עם שקיפות למקורות.',
    },
    {
        icon: <BarChart3 className='w-6 h-6' />,
        title: 'גרפים וטבלאות',
        description: 'הסוכן יוצר גרפים ותרשימים אוטומטית כדי שתוכלו להבין את הנתונים במבט אחד',
    },
    {
        icon: <Globe className='w-6 h-6' />,
        title: '8 מאגרי מידע רשמיים',
        description:
            'חיפוש אוטומטי ב-data.gov.il, למ״ס, מפתח התקציב, הכנסת, GovMap, משרד הבריאות, מאגר התרופות ורשתות מזון.',
    },
    {
        icon: <Map className='w-6 h-6' />,
        title: 'מפה אינטראקטיבית',
        description: 'שאלות על נדל״ן, תכנון עירוני, שירותים ציבוריים וגוש-חלקה מוצגות על מפה אינטראקטיבית.',
    },
    {
        icon: <SlidersHorizontal className='w-6 h-6' />,
        title: 'בחירת מקורות מידע',
        description:
            'ניתן לסנן ולבחור אילו מקורות מידע ישמשו לתשובה — בחירת מקורות ספציפיים מאפשרת תשובות מדויקות ורלוונטיות יותר.',
    },
] as const;

export function AboutSection() {
    return (
        <section id='about' className='w-full max-w-4xl mx-auto px-4'>
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className='flex flex-col items-center gap-4 mb-12 text-center'
            >
                <h2 className='text-2xl md:text-3xl font-bold text-foreground'>על המיזם</h2>
                <p className='text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl'>
                    למדינת ישראל מאגרי מידע ציבוריים רחבים — סטטיסטיקה, מחירים, אוכלוסייה, תחבורה ועוד. המידע קיים, אך
                    אינו תמיד נגיש או פשוט להבנה.
                </p>
                <p className='text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl'>
                    <strong className='text-foreground'>דאטה ישראל</strong> נוצר כדי לחבר בין שאלות יומיומיות למאגרי
                    המידע הציבוריים של ישראל, באמצעות בינה מלאכותית.
                </p>
                <p className='text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl'>
                    המיזם עושה שימוש בבינה מלאכותית כדי לנתח נתונים מ-8 מקורות רשמיים — כולל data.gov.il, הלמ״ס, מפתח
                    התקציב, הכנסת, GovMap, משרד הבריאות, מאגר התרופות ורשתות מזון — ולהציג תשובות מבוססות נתונים כולל
                    טבלאות, גרפים, מפות וקישורים למקור.
                </p>
                <p className='text-base md:text-lg text-foreground font-medium leading-relaxed max-w-2xl'>
                    כל תשובה נשענת על מידע רשמי.
                </p>
            </motion.div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {FEATURES.map((feature, i) => (
                    <Feature
                        key={feature.title}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        delay={i * 0.1}
                    />
                ))}
            </div>
        </section>
    );
}
