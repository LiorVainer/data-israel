'use client';

import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatCard } from './StatCard';
import { UserGuestBreakdownCard } from './UserGuestBreakdownCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ThreadOriginChart } from './charts/ThreadOriginChart';
import { ThreadsOverTimeChart } from './charts/ThreadsOverTimeChart';
import { AgentDelegationChart } from './charts/AgentDelegationChart';

// ---------------------------------------------------------------------------
// Time range types
// ---------------------------------------------------------------------------

export type TimeRange = 'שעה אחרונה' | '24 שעות' | '7 ימים' | '30 ימים' | 'הכל';

const TIME_RANGES: TimeRange[] = ['שעה אחרונה', '24 שעות', '7 ימים', '30 ימים', 'הכל'];

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Compute sinceTimestamp (Unix ms) for a given time range label. Returns undefined for "הכל". */
export function getSinceTimestamp(range: TimeRange): number | undefined {
    const now = Date.now();
    switch (range) {
        case 'שעה אחרונה':
            return now - MS_PER_HOUR;
        case '24 שעות':
            return now - 24 * MS_PER_HOUR;
        case '7 ימים':
            return now - 7 * MS_PER_DAY;
        case '30 ימים':
            return now - 30 * MS_PER_DAY;
        case 'הכל':
            return undefined;
    }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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

function DashboardSkeleton({ isMobile }: { isMobile: boolean }) {
    return (
        <div className='space-y-6'>
            {/* KPI cards skeleton */}
            <section>
                <Skeleton className='mb-3 h-4 w-28' />
                <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-4'}`}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className='rounded-lg border bg-card p-4'>
                            <Skeleton className='mb-2 h-3 w-20' />
                            <Skeleton className='h-7 w-16' />
                        </div>
                    ))}
                </div>
            </section>

            {/* User/Guest breakdown skeleton */}
            <section>
                <Skeleton className='mb-3 h-4 w-28' />
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className='rounded-lg border bg-card p-4 space-y-3'>
                            <Skeleton className='h-5 w-32' />
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-3/4' />
                            <Skeleton className='h-4 w-1/2' />
                        </div>
                    ))}
                </div>
            </section>

            {/* Charts skeleton */}
            <section>
                <Skeleton className='mb-3 h-4 w-16' />
                <div className='space-y-6'>
                    {/* Line chart skeleton */}
                    <div className='rounded-lg border bg-card p-4'>
                        <Skeleton className='mb-4 h-4 w-32' />
                        <Skeleton className={isMobile ? 'h-[300px]' : 'h-[400px]'} />
                    </div>
                    {/* Pie charts skeleton */}
                    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className='rounded-lg border bg-card p-4'>
                                <Skeleton className='mb-4 h-4 w-24' />
                                <div className='flex justify-center gap-4 mb-2'>
                                    <Skeleton className='h-3 w-16' />
                                    <Skeleton className='h-3 w-16' />
                                </div>
                                <Skeleton className={`mx-auto rounded-full ${isMobile ? 'size-[250px]' : 'size-[300px]'}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export function AnalyticsDashboard() {
    const [selectedRange, setSelectedRange] = useState<TimeRange>('7 ימים');
    const isMobile = useIsMobile();

    // Memoize sinceTimestamp so useQuery args stay stable between renders.
    // Recomputes only when selectedRange changes (avoids infinite re-render from Date.now()).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const sinceTimestamp = useMemo(() => getSinceTimestamp(selectedRange), [selectedRange]);

    const bucketSize: 'hour' | 'day' = selectedRange === 'שעה אחרונה' || selectedRange === '24 שעות' ? 'hour' : 'day';

    const stats = useQuery(api.analytics.getOverviewStats, { sinceTimestamp });
    const threadOrigins = useQuery(api.analytics.getThreadOrigins, { sinceTimestamp });
    const threadsOverTime = useQuery(api.analytics.getThreadsOverTime, { sinceTimestamp, bucketSize });
    const agentDelegation = useQuery(api.analytics.getAgentDelegationBreakdown, { sinceTimestamp });

    return (
        <div className='space-y-6'>
            {/* Time Range Selector */}
            <div className='flex flex-col gap-2'>
                <h2 className='text-sm font-medium'>טווח זמן</h2>
                <TimeRangeSelector selected={selectedRange} onChange={setSelectedRange} />
            </div>

            {stats === undefined ? (
                <DashboardSkeleton isMobile={isMobile} />
            ) : (
                <>
                    {/* Section A: Top-level KPI row */}
                    <section aria-label='מדדים עיקריים'>
                        <h2 className='mb-3 text-sm font-medium text-muted-foreground'>מדדים עיקריים</h2>
                        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-4'}`}>
                            <StatCard label='סה״כ שיחות' value={stats.totalThreads} />
                            <StatCard label='סה״כ הודעות' value={stats.totalMessages} />
                            <StatCard label='משתמשים פעילים' value={stats.uniqueActiveUsers} />
                            <StatCard label='ממוצע הודעות לשיחה' value={stats.avgMessagesPerThread.toFixed(1)} />
                        </div>
                    </section>

                    {/* Section B: User vs Guest breakdown */}
                    <section aria-label='פירוט משתמשים ואורחים'>
                        <h2 className='mb-3 text-sm font-medium text-muted-foreground'>פירוט משתמשים</h2>
                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
                            <UserGuestBreakdownCard
                                title='משתמשים רשומים'
                                total={stats.totalRegisteredUsers}
                                active={stats.registeredWhoOpenedThreads}
                                conversionPct={stats.registeredConversionPct}
                                avgThreads={stats.avgThreadsPerUser}
                                avgMessages={stats.avgMessagesPerUser}
                            />
                            <UserGuestBreakdownCard
                                title='אורחים'
                                total={stats.totalGuests}
                                active={stats.guestsWhoOpenedThreads}
                                conversionPct={stats.guestConversionPct}
                                avgThreads={stats.avgThreadsPerGuest}
                                avgMessages={stats.avgMessagesPerGuest}
                            />
                        </div>
                    </section>

                    {/* Section C: Charts grid */}
                    <section aria-label='גרפים'>
                        <h2 className='mb-3 text-sm font-medium text-muted-foreground'>גרפים</h2>
                        <div className='space-y-6'>
                            {/* Threads over time — full width */}
                            <div className='rounded-lg border bg-card p-4'>
                                <ThreadsOverTimeChart data={threadsOverTime ?? []} isMobile={isMobile} />
                            </div>
                            {/* Pie charts side by side on desktop */}
                            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                <div className='rounded-lg border bg-card p-4'>
                                    <ThreadOriginChart data={threadOrigins ?? []} isMobile={isMobile} />
                                </div>
                                <div className='rounded-lg border bg-card p-4'>
                                    <AgentDelegationChart data={agentDelegation ?? []} isMobile={isMobile} />
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
