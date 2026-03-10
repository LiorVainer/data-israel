'use client';

import { ResponsiveBar } from '@nivo/bar';
import { useChartColors } from '@/hooks/use-chart-colors';
import { nivoTheme } from './nivo-theme';
import type { TokenUsageByModelEntry } from '@/convex/analytics';
import type { BarDatum, BarTooltipProps } from '@nivo/bar';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOKEN_LABELS: Record<string, string> = {
    promptTokens: 'טוקני קלט',
    completionTokens: 'טוקני פלט',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncate model ID to the last segment after '/' for display */
function truncateModelId(model: string): string {
    const parts = model.split('/');
    return parts[parts.length - 1];
}

/** Format axis tick values with 'k' suffix for thousands */
function formatTickValue(value: number): string {
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(value);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChartDataPoint extends BarDatum {
    model: string;
    fullModel: string;
    promptTokens: number;
    completionTokens: number;
}

interface TokenUsageChartProps {
    data: TokenUsageByModelEntry[];
    isMobile: boolean;
}

// ---------------------------------------------------------------------------
// TokenUsageChart
// ---------------------------------------------------------------------------

export function TokenUsageChart({ data, isMobile }: TokenUsageChartProps) {
    const colors = useChartColors();

    if (data.length === 0) {
        return (
            <div className='flex h-[300px] items-center justify-center text-sm text-muted-foreground'>אין נתונים</div>
        );
    }

    const chartHeight = isMobile ? 300 : 400;

    const chartData: ChartDataPoint[] = data.map((d) => ({
        model: truncateModelId(d.model),
        fullModel: d.model,
        promptTokens: d.promptTokens,
        completionTokens: d.completionTokens,
    }));

    return (
        <div>
            <h3 className='mb-2 text-sm font-medium text-muted-foreground'>צריכת טוקנים לפי מודל</h3>
            <div style={{ height: chartHeight }}>
                <ResponsiveBar<ChartDataPoint>
                    data={chartData}
                    keys={['promptTokens', 'completionTokens']}
                    indexBy='model'
                    groupMode='stacked'
                    colors={[colors[0], colors[1]]}
                    theme={nivoTheme}
                    margin={
                        isMobile
                            ? { top: 10, right: 10, bottom: 100, left: 55 }
                            : { top: 10, right: 20, bottom: 100, left: 65 }
                    }
                    padding={0.3}
                    borderRadius={4}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 10,
                        tickRotation: -35,
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 10,
                        tickRotation: 0,
                        format: (v) => formatTickValue(v as number),
                    }}
                    enableLabel={false}
                    tooltip={({ data: d }: BarTooltipProps<ChartDataPoint>) => (
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
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>{d.fullModel}</div>
                            <div>
                                <span style={{ opacity: 0.7 }}>טוקני קלט: </span>
                                <span>{d.promptTokens.toLocaleString()}</span>
                            </div>
                            <div>
                                <span style={{ opacity: 0.7 }}>טוקני פלט: </span>
                                <span>{d.completionTokens.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    legendLabel={(datum) => TOKEN_LABELS[datum.id as string] ?? String(datum.id)}
                    legends={[
                        {
                            dataFrom: 'keys',
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 90,
                            itemsSpacing: 16,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemTextColor: 'currentColor',
                            itemDirection: 'right-to-left',
                            symbolSize: 10,
                            symbolShape: 'square',
                        },
                    ]}
                />
            </div>
        </div>
    );
}
