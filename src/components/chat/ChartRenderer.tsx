'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import type { LineCustomSvgLayerProps } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import type {
    DisplayBarChartInput,
    DisplayChartInput,
    DisplayLineChartInput,
    DisplayPieChartInput,
} from '@/lib/tools/client/display-chart';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronDown, BarChart2 } from 'lucide-react';
import { useState } from 'react';

/** Modern chart palette — varied hues for visual distinction */
const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

/** Responsive chart margins */
const CHART_MARGINS = {
    mobile: { top: 10, right: 0, bottom: 50, left: 20 },
    desktop: { top: 20, right: 20, bottom: 60, left: 80 },
} as const;

/** Estimate pixel width needed for the longest Y-axis tick label in bar charts */
function estimateBarAxisLabelWidth(data: Record<string, unknown>[], indexBy: string): number {
    let maxLen = 0;
    for (const d of data) {
        const label = String(d[indexBy] ?? '');
        if (label.length > maxLen) maxLen = label.length;
    }
    // ~7px per character at fontSize 11, plus padding
    return maxLen * 7 + 16;
}

/** Estimate pixel width needed for the longest Y-axis tick label */
function estimateAxisLabelWidth(data: DisplayLineChartInput['data'], isPct: boolean): number {
    let maxVal = 0;
    for (const series of data) {
        for (const pt of series.data) {
            const abs = Math.abs(typeof pt.y === 'number' ? pt.y : 0);
            if (abs > maxVal) maxVal = abs;
        }
    }
    const rounded = Math.round(maxVal * 100) / 100;
    const label = isPct ? `${rounded}%` : String(rounded);
    // ~7px per character at fontSize 11
    return label.length * 7 + 12;
}

/** Base line chart margins — left is computed dynamically */
const LINE_MARGIN_BASE = {
    mobile: { top: 10, right: 10, bottom: 50 },
    desktop: { top: 20, right: 60, bottom: 60 },
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
        legends: {
            text: { fill: 'var(--foreground)', fontSize: 12 },
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
    const isMultiKey = keys.length > 1;
    const labelFor = (key: string) => keyLabels?.[key] ?? key;
    const isPct = valueFormat === 'percent';
    const fmtNum = (v: number | null | undefined) => {
        if (v == null) return '';
        const rounded = Math.round(v * 100) / 100;
        return isPct ? `${rounded}%` : String(rounded);
    };

    // Detect if data contains negative values to adjust layout
    const hasNegative = data.some((d) => keys.some((k) => typeof d[k] === 'number' && (d[k] as number) < 0));
    const hasPositive = data.some((d) => keys.some((k) => typeof d[k] === 'number' && (d[k] as number) > 0));
    const hasMixed = hasNegative && hasPositive;

    // For horizontal layout, dynamically compute left margin so Y-axis labels aren't covered by bars
    const baseMargin = isMobile ? CHART_MARGINS.mobile : CHART_MARGINS.desktop;
    const dynamicLeft =
        layout === 'horizontal'
            ? Math.max(estimateBarAxisLabelWidth(data, indexBy), isMobile ? 60 : 80)
            : baseMargin.left;
    const margin = {
        ...baseMargin,
        left: dynamicLeft,
        ...(hasNegative ? { bottom: baseMargin.bottom + 30 } : {}),
    };

    // Add a zero-line marker when data has both positive and negative values
    const markers = hasMixed
        ? [
              {
                  axis: layout === 'vertical' ? ('y' as const) : ('x' as const),
                  value: 0,
                  lineStyle: {
                      stroke: 'var(--muted-foreground)',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                  },
              },
          ]
        : undefined;

    return (
        <div className='w-full' dir='rtl'>
            {title && <h4 className='text-center text-sm font-medium mb-2 text-foreground'>{title}</h4>}
            {isMultiKey && (
                <div className='flex items-center justify-center gap-4 mb-1' dir='ltr'>
                    {keys.map((key, i) => (
                        <div key={key} className='flex items-center gap-1.5'>
                            <span
                                className='inline-block size-2.5 shrink-0 rounded-full'
                                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                            <span className='text-xs text-muted-foreground'>{labelFor(key)}</span>
                        </div>
                    ))}
                </div>
            )}
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
                    markers={markers}
                    tooltipLabel={(datum) =>
                        isMultiKey ? `${datum.indexValue} — ${labelFor(String(datum.id))}` : String(datum.indexValue)
                    }
                    enableLabel={true}
                    label={(d) => fmtNum(d.value)}
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
    const isPct = valueFormat === 'percent';
    const baseMargin = isMobile ? LINE_MARGIN_BASE.mobile : LINE_MARGIN_BASE.desktop;
    const axisWidth = estimateAxisLabelWidth(data, isPct);
    const margin = { ...baseMargin, left: Math.max(axisWidth + 10, isMobile ? 50 : 70) };
    const fmtNum = (v: number | null | undefined) => {
        if (v == null) return '';
        const rounded = Math.round(v * 100) / 100;
        return isPct ? `${rounded}%` : String(rounded);
    };

    // Custom layer that renders point labels with edge-awareness:
    // skips first/last points to avoid overlap with Y-axis and right edge
    const PointLabelsLayer = ({
        points,
        innerWidth,
    }: LineCustomSvgLayerProps<{ id: string; data: { x: string | number; y: number }[] }>) => {
        if (isMobile) return null;
        const edgePad = 40;
        return (
            <g>
                {points.map((point) => {
                    if (point.x < edgePad || point.x > innerWidth - edgePad) return null;
                    const yVal = point.data.y;
                    const label = fmtNum(typeof yVal === 'number' ? yVal : null);
                    if (!label) return null;
                    return (
                        <text
                            key={point.id}
                            x={point.x}
                            y={point.y - 14}
                            textAnchor='middle'
                            dominantBaseline='auto'
                            style={{
                                fill: 'var(--muted-foreground)',
                                fontSize: 11,
                            }}
                        >
                            {label}
                        </text>
                    );
                })}
            </g>
        );
    };

    return (
        <div className='w-full' dir='rtl'>
            {title && <h4 className='text-center text-sm font-medium mb-2 text-foreground'>{title}</h4>}
            <div className='h-[400px] overflow-hidden'>
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
                        format: (v) => fmtNum(typeof v === 'number' ? v : Number(v)),
                    }}
                    enableGridX={false}
                    layers={[
                        'grid',
                        'markers',
                        'axes',
                        'areas',
                        'crosshair',
                        'lines',
                        'points',
                        'slices',
                        'mesh',
                        'legends',
                        PointLabelsLayer,
                    ]}
                    enablePoints={true}
                    pointSize={8}
                    pointColor={{ from: 'color' }}
                    pointBorderWidth={0}
                    enablePointLabel={false}
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
    const margin = isMobile ? { top: 10, right: 10, bottom: 60, left: 10 } : PIE_MARGINS.desktop;

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
                    enableArcLinkLabels={!isMobile}
                    legends={
                        isMobile
                            ? [
                                  {
                                      anchor: 'bottom',
                                      direction: 'row',
                                      translateY: 50,
                                      itemsSpacing: 4,
                                      itemWidth: 80,
                                      itemHeight: 18,
                                      itemDirection: 'right-to-left',
                                      symbolSize: 10,
                                      symbolShape: 'circle',
                                  },
                              ]
                            : undefined
                    }
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

const CHART_LABELS: Record<string, string> = {
    bar: 'תרשים עמודות',
    line: 'תרשים קו',
    pie: 'תרשים עוגה',
};

export function ChartRenderer({ data }: ChartRendererProps) {
    const { chartType, title } = data;
    const [open, setOpen] = useState(true);

    let chart: React.ReactNode;
    switch (chartType) {
        case 'bar': {
            const barData = data as DisplayBarChartInput & { chartType: 'bar' };
            chart = <BarChartRenderer data={barData.data} config={barData.config} title={title} />;
            break;
        }
        case 'line': {
            const lineData = data as DisplayLineChartInput & { chartType: 'line' };
            chart = <LineChartRenderer data={lineData.data} config={lineData.config} title={title} />;
            break;
        }
        case 'pie': {
            const pieData = data as DisplayPieChartInput & { chartType: 'pie' };
            chart = <PieChartRenderer data={pieData.data} config={pieData.config} title={title} />;
            break;
        }
        default:
            return <ChartError error='סוג תרשים לא נתמך' />;
    }

    const label = CHART_LABELS[chartType] ?? 'תרשים';
    const description = title ?? label;

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className='w-full overflow-hidden rounded-lg border border-border'
        >
            <CollapsibleTrigger className='flex w-full items-center justify-between gap-2 bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50'>
                <div className='flex items-center gap-2'>
                    <BarChart2 className='size-3.5 shrink-0' />
                    <span>{description}</span>
                </div>
                <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className='p-3'>{chart}</div>
            </CollapsibleContent>
        </Collapsible>
    );
}
