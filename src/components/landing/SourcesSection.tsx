'use client';

import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LANDING_CATEGORIES, type LandingCategory } from '@/data-sources/types';
import { getDataSourcesWithLanding } from '@/data-sources/registry';
import { SourceCard } from './SourceCard';

type LandingSource = ReturnType<typeof getDataSourcesWithLanding>[number];

const sortedCategories = (
    Object.entries(LANDING_CATEGORIES) as [LandingCategory, (typeof LANDING_CATEGORIES)[LandingCategory]][]
).sort(([, a], [, b]) => a.order - b.order);

const sources = getDataSourcesWithLanding();

const sourcesByCategory: Partial<Record<LandingCategory, LandingSource[]>> = Object.groupBy(
    sources,
    (s) => s.landing.category,
);

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

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <Tabs defaultValue={sortedCategories[0]?.[0]} dir='rtl'>
                    <TabsList className='w-full justify-center mb-8'>
                        {sortedCategories.map(([id, cat]) => (
                            <TabsTrigger key={id} value={id}>
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {sortedCategories.map(([catId]) => (
                        <TabsContent key={catId} value={catId}>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                                {(sourcesByCategory[catId] ?? [])
                                    .sort((a, b) => a.landing.order - b.landing.order)
                                    .map((source) => (
                                        <SourceCard key={source.id} source={source} />
                                    ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </motion.div>
        </section>
    );
}
