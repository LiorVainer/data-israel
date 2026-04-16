'use client';

import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { AnswerRatingStats } from './AnswerRatingStats';
import { AnswersList } from './AnswersList';
import { getSinceTimestamp, type TimeRange } from './AnalyticsDashboard';

const TIME_RANGES: TimeRange[] = ['שעה אחרונה', '24 שעות', '7 ימים', '30 ימים', 'הכל'];

function TimeRangeSelector({ selected, onChange }: { selected: TimeRange; onChange: (range: TimeRange) => void }) {
    return (
        <div className='flex flex-wrap gap-1' role='group' aria-label='טווח זמן'>
            {TIME_RANGES.map((range) => (
                <button
                    key={range}
                    type='button'
                    onClick={() => onChange(range)}
                    aria-pressed={selected === range}
                    className={[
                        'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                        selected === range
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted',
                    ].join(' ')}
                >
                    {range}
                </button>
            ))}
        </div>
    );
}

function ConversationsSkeleton() {
    return (
        <div className='space-y-6'>
            {/* Rating stats skeleton */}
            <section>
                <Skeleton className='mb-3 h-4 w-28' />
                <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className='rounded-lg border bg-card p-4'>
                            <Skeleton className='mb-2 h-3 w-20' />
                            <Skeleton className='h-7 w-16' />
                        </div>
                    ))}
                </div>
            </section>

            {/* Answers list skeleton */}
            <section>
                <div className='rounded-lg border bg-card p-4 space-y-3'>
                    <Skeleton className='h-8 w-full' />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className='space-y-2 border-t pt-3'>
                            <div className='flex justify-between'>
                                <Skeleton className='h-3 w-24' />
                                <Skeleton className='h-3 w-4' />
                            </div>
                            <Skeleton className='h-3 w-16' />
                            <Skeleton className='h-8 w-full' />
                            <Skeleton className='h-3 w-16' />
                            <Skeleton className='h-12 w-full' />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export function ConversationsDashboard() {
    const [selectedRange, setSelectedRange] = useState<TimeRange>('7 ימים');
    const sinceTimestamp = useMemo(() => getSinceTimestamp(selectedRange), [selectedRange]);

    const ratingStats = useQuery(api.analytics.getAnswerRatingStats, { sinceTimestamp });
    const answersList = useQuery(api.analytics.getAnswersList, { sinceTimestamp });

    return (
        <div className='space-y-6'>
            {/* Time Range Selector */}
            <div className='flex flex-col gap-2'>
                <h2 className='text-sm font-medium'>טווח זמן</h2>
                <TimeRangeSelector selected={selectedRange} onChange={setSelectedRange} />
            </div>

            {ratingStats === undefined ? (
                <ConversationsSkeleton />
            ) : (
                <>
                    {/* Section E: Answer rating stats */}
                    <section aria-label='דירוג תשובות'>
                        <h2 className='mb-3 text-sm font-medium text-muted-foreground'>דירוג תשובות</h2>
                        <AnswerRatingStats
                            totalAnswers={ratingStats.totalAnswers}
                            totalRated={ratingStats.totalRated}
                            goodCount={ratingStats.goodCount}
                            badCount={ratingStats.badCount}
                        />
                    </section>

                    {/* Section F: Answers list */}
                    <section aria-label='תשובות ושאלות'>
                        <div className='rounded-lg border bg-card p-4'>
                            <AnswersList data={answersList ?? []} />
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
