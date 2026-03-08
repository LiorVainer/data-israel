'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import type { DisplayBarChartInput, DisplayChartInput, DisplayLineChartInput, DisplayPieChartInput } from '@/lib/tools';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';

/** Modern chart palette — varied hues for visual distinction */
const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

/** Responsive chart margins */
const CHART_MARGINS = {
    mobile: { top: 10, right: 0, bottom: 50, left: 20 },
    desktop: { top: 20, right: 20, bottom: 60, left: 80 },
} as const;

const PIE_MARGINS = {
    mobile: { top: 20, right: 40, bottom: 20, left: 40 },
    desktop: { top: 40, right: 80, bottom: 40, left: 80 },
} as const;

/**
 * Nivo theme — adapts to light/dark via CSS variables.
 * Grid lines are subtle, tooltip is styled to match the app.
 */
function useNivoTheme() {
    const { resolvedTheme } = useTheme();
    void resolvedTheme;

    return {
        text: {
            fill: 'var(--muted-foreground)',
            fontSize: 11,
        },
        axis: {
            ticks: {
                text: { fill: 'var(--muted-foreground)', fontSize: 11 },
                line: { stroke: 'transparent' },
            },
            legend: {
                text: { fill: 'var(--foreground)', fontWeight: 600 },
            },
            domain: {
                line: { stroke: 'transparent' },
            },
        },
        grid: {
            line: { stroke: 'var(--border)', strokeDasharray: '4 4' },
        },
        crosshair: {
            line: { stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' },
        },
        tooltip: {
            container: {
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                fontSize: 12,
                borderRadius: '10px',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                padding: '8px 12px',
            },
        },
    };
}

// ============================================================================
// Chart Loading State
// ============================================================================

export function ChartLoadingState() {
    return (
        <div className='w-full h-[400px] flex items-center justify-center bg-muted/30 rounded-lg border border-border'>
            <Shimmer as='span' duration={1.5}>
                טוען תרשים...
            </Shimmer>
        </div>
    );
}

// ============================================================================
// Chart Error State
// ============================================================================

export interface ChartErrorProps {
    error?: string;
}

export function ChartError({ error }: ChartErrorProps) {
    return (
        <div className='w-full h-[200px] flex items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800'>
            <p className='text-error text-sm'>{error || 'שגיאה בהצגת התרשים'}</p>
        </div>
    );
}

// ============================================================================
// Bar Chart Renderer
// ============================================================================

interface BarChartRendererProps {
    data: DisplayBarChartInput['data'];
    config: DisplayBarChartInput['config'];
    title?: string;
}

function BarChartRenderer({ data, config, title }: BarChartRendererProps) {
    const {
        indexBy,
        keys,
        keyLabels,
        valueFormat = 'number',
        layout = 'vertical',
        groupMode = 'grouped',
        uniqueColors = true,
    } = config;
    const nivoTheme = useNivoTheme();
    const isMobile = useIsMobile();
    const margin = isMobile ? CHART_MARGINS.mobile : CHART_MARGINS.desktop;
    const isMultiKey = keys.length > 1;
    const labelFor = (key: string) => keyLabels?.[key] ?? key;
    const isPct = valueFormat === 'percent';

    return (
        <div className='w-full' dir='rtl'>
            {title && <h4 className='text-center text-sm font-medium mb-2 text-foreground'>{title}</h4>}
            <div className='h-[400px]'>
                <ResponsiveBar
                    data={data}
                    keys={keys}
                    indexBy={indexBy}
                    layout={layout}
                    groupMode={groupMode}
                    margin={margin}
                    padding={0.25}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={CHART_COLORS}
                    colorBy={uniqueColors && !isMultiKey ? 'indexValue' : 'id'}
                    theme={nivoTheme}
                    borderRadius={6}
                    borderWidth={0}
                    axisBottom={{
                        tickSize: 0,
                        tickPadding: 8,
                        tickRotation: -45,
                    }}
                    axisLeft={{
                        tickSize: 0,
                        tickPadding: 8,
                        tickRotation: 0,
                    }}
                    enableGridX={false}
                    tooltipLabel={(datum) =>
                        isMultiKey ? `${datum.indexValue} — ${labelFor(String(datum.id))}` : String(datum.indexValue)
                    }
                    legends={
                        isMultiKey
                            ? [
                                  {
                                      dataFrom: 'keys',
                                      data: keys.map((key, i) => ({
                                          id: key,
                                          label: labelFor(key),
                                          color: CHART_COLORS[i % CHART_COLORS.length],
                                      })),
                                      anchor: 'top-right',
                                      direction: 'column',
                                      translateX: 0,
                                      translateY: -10,
                                      itemsSpacing: 2,
                                      itemWidth: 100,
                                      itemHeight: 20,
                                      itemDirection: 'right-to-left',
                                      symbolSize: 12,
                                      symbolShape: 'circle',
                                  },
                              ]
                            : undefined
                    }
                    enableLabel={true}
                    label={(d) => (isPct ? `${d.value}%` : String(d.value ?? ''))}
                    labelSkipWidth={16}
                    labelSkipHeight={16}
                    labelTextColor='#ffffff'
                    animate={true}
                    motionConfig='gentle'
                    role='img'
                    ariaLabel={title || 'Bar chart'}
                />
            </div>
        </div>
    );
}

// ============================================================================
// Line Chart Renderer
// ============================================================================

interface LineChartRendererProps {
    data: DisplayLineChartInput['data'];
    config: DisplayLineChartInput['config'];
    title?: string;
}

function LineChartRenderer({ data, config, title }: LineChartRendererProps) {
    const { valueFormat = 'number', enableArea = false, curve = 'monotoneX' } = config;
    const nivoTheme = useNivoTheme();
    const isMobile = useIsMobile();
    const margin = isMobile ? CHART_MARGINS.mobile : CHART_MARGINS.desktop;
    const isPct = valueFormat === 'percent';

    return (
        <div className='w-full' dir='rtl'>
            {title && <h4 className='text-center text-sm font-medium mb-2 text-foreground'>{title}</h4>}
            <div className='h-[400px]'>
                <ResponsiveLine
                    data={data}
                    margin={margin}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
                    curve={curve}
                    colors={CHART_COLORS}
                    lineWidth={3}
                    theme={nivoTheme}
                    axisBottom={{
                        tickSize: 0,
                        tickPadding: 8,
                        tickRotation: -45,
                    }}
                    axisLeft={{
                        tickSize: 0,
                        tickPadding: 8,
                        tickRotation: 0,
                        format: isPct ? (v) => `${v}%` : undefined,
                    }}
                    enableGridX={false}
                    enablePoints={true}
                    pointSize={8}
                    pointColor={{ from: 'color' }}
                    pointBorderWidth={0}
                    enablePointLabel={true}
                    pointLabel={(d) => (isPct ? `${d.y}%` : String(d.y ?? ''))}
                    pointLabelYOffset={-14}
                    enableArea={enableArea}
                    areaOpacity={0.1}
                    areaBlendMode='normal'
                    useMesh={true}
                    enableSlices='x'
                    animate={true}
                    motionConfig='gentle'
                    role='img'
                    ariaLabel={title || 'Line chart'}
                />
            </div>
        </div>
    );
}

// ============================================================================
// Pie Chart Renderer
// ============================================================================

interface PieChartRendererProps {
    data: DisplayPieChartInput['data'];
    config: DisplayPieChartInput['config'];
    title?: string;
}

function PieChartRenderer({ data, config, title }: PieChartRendererProps) {
    const { innerRadius = 0 } = config;
    const nivoTheme = useNivoTheme();
    const isMobile = useIsMobile();
    const margin = isMobile ? PIE_MARGINS.mobile : PIE_MARGINS.desktop;

    return (
        <div className='w-full' dir='rtl'>
            {title && <h4 className='text-center text-sm font-medium mb-2 text-foreground'>{title}</h4>}
            <div className='h-[400px]'>
                <ResponsivePie
                    data={data}
                    margin={margin}
                    innerRadius={innerRadius}
                    padAngle={1}
                    cornerRadius={4}
                    activeOuterRadiusOffset={8}
                    activeInnerRadiusOffset={4}
                    colors={CHART_COLORS}
                    theme={nivoTheme}
                    borderWidth={0}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor='var(--foreground)'
                    arcLinkLabelsThickness={1.5}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor='#ffffff'
                    enableArcLabels={true}
                    enableArcLinkLabels={true}
                    animate={true}
                    motionConfig='gentle'
                    role='img'
                />
            </div>
        </div>
    );
}

// ============================================================================
// Main Chart Renderer
// ============================================================================

export interface ChartRendererProps {
    data: DisplayChartInput;
}

export function ChartRenderer({ data }: ChartRendererProps) {
    const { chartType, title } = data;

    switch (chartType) {
        case 'bar': {
            const barData = data as DisplayBarChartInput & { chartType: 'bar' };
            return <BarChartRenderer data={barData.data} config={barData.config} title={title} />;
        }
        case 'line': {
            const lineData = data as DisplayLineChartInput & { chartType: 'line' };
            return <LineChartRenderer data={lineData.data} config={lineData.config} title={title} />;
        }
        case 'pie': {
            const pieData = data as DisplayPieChartInput & { chartType: 'pie' };
            return <PieChartRenderer data={pieData.data} config={pieData.config} title={title} />;
        }
        default:
            return <ChartError error='סוג תרשים לא נתמך' />;
    }
}
