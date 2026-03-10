'use client';

import { ResponsiveLine } from '@nivo/line';
import { useChartColors } from '@/hooks/use-chart-colors';
import { nivoTheme } from './nivo-theme';
import type { ThreadsBucketEntry } from '@/convex/analytics';
import type { SliceTooltipProps, LineSeries } from '@nivo/line';

// ---------------------------------------------------------------------------
// Date formatting helpers
// ---------------------------------------------------------------------------

/** Format an ISO bucket string to a short day/month label */
function formatBucketDate(bucket: string): string {
    const d = new Date(bucket);
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1;
    return `${day}/${month}`;
}

/** Format an ISO bucket string to a full readable date for tooltips */
function formatBucketFull(bucket: string): string {
    const d = new Date(bucket);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    // For hourly buckets include time; for daily just show date
    if (hours !== '00' || minutes !== '00') {
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThreadsOverTimeChartProps {
    data: ThreadsBucketEntry[];
    isMobile: boolean;
}

// We keep a parallel lookup so the tooltip can show the full date
// from the original bucket string (not the formatted x-axis label).
type BucketLookup = Record<string, string>;

// ---------------------------------------------------------------------------
// ThreadsOverTimeChart
// ---------------------------------------------------------------------------

export function ThreadsOverTimeChart({ data, isMobile }: ThreadsOverTimeChartProps) {
    const colors = useChartColors();

    if (data.length === 0) {
        return (
            <div className='flex h-[300px] items-center justify-center text-sm text-muted-foreground'>אין נתונים</div>
        );
    }

    const chartHeight = isMobile ? 300 : 400;

    // Build a lookup from formatted label back to the original bucket
    const bucketLookup: BucketLookup = {};
    for (const d of data) {
        bucketLookup[formatBucketDate(d.bucket)] = d.bucket;
    }

    const lineData = [
        {
            id: 'שיחות',
            data: data.map((d) => ({
                x: formatBucketDate(d.bucket),
                y: d.count,
            })),
        },
    ];

    return (
        <div>
            <h3 className='mb-4 text-sm font-medium text-muted-foreground'>שיחות לאורך זמן</h3>
            <div style={{ height: chartHeight }}>
                <ResponsiveLine
                    data={lineData}
                    enableArea={true}
                    areaOpacity={0.15}
                    curve='monotoneX'
                    colors={[colors[0]]}
                    theme={nivoTheme}
                    margin={
                        isMobile
                            ? { top: 10, right: 10, bottom: 40, left: 45 }
                            : { top: 10, right: 20, bottom: 40, left: 55 }
                    }
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 10,
                        tickRotation: 0,
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 10,
                        tickRotation: 0,
                    }}
                    pointSize={8}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    enableGridX={false}
                    useMesh={true}
                    enableSlices='x'
                    sliceTooltip={({ slice }: SliceTooltipProps<LineSeries>) => {
                        const point = slice.points[0];
                        const xLabel = String(point.data.x);
                        const originalBucket = bucketLookup[xLabel] ?? xLabel;
                        return (
                            <div
                                style={{
                                    background: 'var(--card)',
                                    color: 'var(--card-foreground)',
                                    borderRadius: 6,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    fontSize: 13,
                                    padding: '8px 12px',
                                    direction: 'rtl',
                                }}
                            >
                                <div>
                                    <span style={{ opacity: 0.7 }}>תאריך: </span>
                                    <span style={{ fontWeight: 500 }}>{formatBucketFull(originalBucket)}</span>
                                </div>
                                <div>
                                    <span style={{ opacity: 0.7 }}>שיחות: </span>
                                    <span style={{ fontWeight: 500 }}>{String(point.data.yFormatted)}</span>
                                </div>
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
}
