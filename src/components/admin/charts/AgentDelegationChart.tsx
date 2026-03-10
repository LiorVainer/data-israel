'use client';

import { ResponsivePie } from '@nivo/pie';
import { useChartColors } from '@/hooks/use-chart-colors';
import { nivoTheme } from './nivo-theme';
import type { AgentDelegationEntry } from '@/convex/analytics';
import type { ComputedDatum } from '@nivo/pie';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PieDatum {
    id: string;
    label: string;
    value: number;
}

interface AgentDelegationChartProps {
    data: AgentDelegationEntry[];
    isMobile: boolean;
}

// ---------------------------------------------------------------------------
// AgentDelegationChart
// ---------------------------------------------------------------------------

export function AgentDelegationChart({ data, isMobile }: AgentDelegationChartProps) {
    const colors = useChartColors();

    if (data.length === 0) {
        return (
            <div className='flex h-[300px] items-center justify-center text-sm text-muted-foreground'>אין נתונים</div>
        );
    }

    const total = data.reduce((sum, d) => sum + d.count, 0);
    const chartHeight = isMobile ? 300 : 400;

    const chartData: PieDatum[] = data.map((d) => ({
        id: d.label,
        label: d.label,
        value: d.count,
    }));

    return (
        <div>
            <h3 className='mb-4 text-sm font-medium text-muted-foreground'>חלוקת פניות לפי מקור מידע</h3>
            <div style={{ height: chartHeight }}>
                <ResponsivePie<PieDatum>
                    data={chartData}
                    innerRadius={0}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={6}
                    colors={colors}
                    borderWidth={0}
                    enableArcLinkLabels={false}
                    arcLabelsSkipAngle={15}
                    arcLabel='value'
                    arcLabelsTextColor='white'
                    theme={nivoTheme}
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    tooltip={({ datum }: { datum: ComputedDatum<PieDatum> }) => {
                        const percent = total > 0 ? Math.round((datum.value / total) * 100) : 0;
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
                                <span style={{ fontWeight: 500 }}>{datum.label}</span>:{' '}
                                <span>
                                    {datum.value} פניות ({percent}%)
                                </span>
                            </div>
                        );
                    }}
                />
            </div>
            <div className='flex flex-wrap items-center justify-center gap-4 mt-3' dir='ltr'>
                {chartData.map((d, i) => (
                    <div key={d.id} className='flex items-center gap-1.5'>
                        <span
                            className='inline-block size-2.5 shrink-0 rounded-full'
                            style={{ backgroundColor: colors[i % colors.length] }}
                        />
                        <span className='text-xs text-muted-foreground'>{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
