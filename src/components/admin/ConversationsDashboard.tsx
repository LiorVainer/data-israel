'use client';

import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { AnswerRatingStats } from './AnswerRatingStats';
import { AnswersList } from './AnswersList';
import { AnswersOverTimeChart } from './charts/AnswersOverTimeChart';
import { getSinceTimestamp, type TimeRange } from './AnalyticsDashboard';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from './DateRangePicker';
import { useIsMobile } from '@/hooks/use-mobile';

const TIME_RANGES: TimeRange[] = ['שעה אחרונה', '24 שעות', '7 ימים', '30 ימים', 'הכל'];

function TimeRangeSelector({
    selected,
    onChange,
}: {
    selected: TimeRange | null;
    onChange: (range: TimeRange) => void;
}) {
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
            {/* Line chart skeleton */}
            <section>
                <div className='rounded-lg border bg-card p-4'>
                    <Skeleton className='mb-4 h-4 w-32' />
                    <Skeleton className='h-[300px]' />
                </div>
            </section>

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
    const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
    const isMobile = useIsMobile();

    const sinceTimestamp = useMemo(() => {
        if (customDateRange?.from) {
            const d = new Date(customDateRange.from);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }
        return getSinceTimestamp(selectedRange);
    }, [customDateRange, selectedRange]);

    const untilTimestamp = useMemo(() => {
        if (customDateRange?.from) {
            const end = customDateRange.to ?? customDateRange.from;
            const d = new Date(end);
            d.setHours(23, 59, 59, 999);
            return d.getTime();
        }
        return undefined;
    }, [customDateRange]);

    const bucketSize: 'hour' | 'day' =
        !customDateRange && (selectedRange === 'שעה אחרונה' || selectedRange === '24 שעות') ? 'hour' : 'day';

    function handlePresetChange(range: TimeRange) {
        setCustomDateRange(undefined);
        setSelectedRange(range);
    }

    const ratingStats = useQuery(api.analytics.getAnswerRatingStats, { sinceTimestamp, untilTimestamp });
    const answersList = useQuery(api.analytics.getAnswersList, { sinceTimestamp, untilTimestamp });
    const answersOverTime = useQuery(api.analytics.getAnswersOverTime, { sinceTimestamp, untilTimestamp, bucketSize });

    return (
        <div className='space-y-6'>
            {/* Time Range Selector */}
            <div className='flex flex-col gap-2'>
                <h2 className='text-sm font-medium'>טווח זמן</h2>
                <div className='flex flex-wrap items-center gap-1'>
                    <TimeRangeSelector
                        selected={customDateRange ? null : selectedRange}
                        onChange={handlePresetChange}
                    />
                    <DateRangePicker value={customDateRange} onChange={setCustomDateRange} />
                </div>
            </div>

            {ratingStats === undefined ? (
                <ConversationsSkeleton />
            ) : (
                <>
                    {/* Answers over time chart */}
                    <section aria-label='תשובות לאורך זמן'>
                        <div className='rounded-lg border bg-card p-4'>
                            <AnswersOverTimeChart data={answersOverTime ?? []} isMobile={isMobile} />
                        </div>
                    </section>

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
