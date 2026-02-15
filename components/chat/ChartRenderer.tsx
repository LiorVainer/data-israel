'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import type { DisplayBarChartInput, DisplayChartInput, DisplayLineChartInput, DisplayPieChartInput } from '@/lib/tools';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';

// Theme colors matching globals.css chart colors
const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

/** Responsive chart margins — tighter on mobile to maximize chart area */
const CHART_MARGINS = {
    mobile: { top: 10, right: 0, bottom: 50, left: 20 },
    desktop: { top: 20, right: 20, bottom: 60, left: 80 },
} as const;

const PIE_MARGINS = {
    mobile: { top: 20, right: 40, bottom: 20, left: 40 },
    desktop: { top: 40, right: 80, bottom: 40, left: 80 },
} as const;

/**
 * Nivo theme that adapts to the app's light/dark mode using CSS variables from globals.css.
 * Tooltip container uses CSS var() directly (it's a DOM element).
 * SVG elements (axis, grid) need resolved values, so we read computed styles.
 */
function useNivoTheme() {
    const { resolvedTheme } = useTheme();
    // Dependency on resolvedTheme ensures re-render on theme change.
    // We still use CSS vars so colors stay in sync with globals.css.
    void resolvedTheme;

    return {
        text: {
            fill: 'var(--muted-foreground)',
            fontSize: 11,
        },
        axis: {
            ticks: {
                text: { fill: 'var(--muted-foreground)' },
                line: { stroke: 'var(--border)' },
            },
            legend: {
                text: { fill: 'var(--foreground)' },
            },
        },
        grid: {
            line: { stroke: 'var(--border)' },
        },
        crosshair: {
            line: { stroke: 'var(--muted-foreground)', strokeWidth: 1 },
        },
        tooltip: {
            container: {
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                fontSize: 12,
                borderRadius: '8px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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
            <p className='text-red-600 dark:text-red-400 text-sm'>{error || 'שגיאה בהצגת התרשים'}</p>
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
    const { indexBy, keys, layout = 'vertical', groupMode = 'grouped' } = config;
    const nivoTheme = useNivoTheme();
    const isMobile = useIsMobile();
    const margin = isMobile ? CHART_MARGINS.mobile : CHART_MARGINS.desktop;

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
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={CHART_COLORS}
                    theme={nivoTheme}
                    borderRadius={4}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                    }}
                    enableLabel={true}
                    labelSkipWidth={16}
                    labelSkipHeight={16}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    animate={true}
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
    const { enableArea = false, curve = 'monotoneX' } = config;
    const nivoTheme = useNivoTheme();
    const isMobile = useIsMobile();
    const margin = isMobile ? CHART_MARGINS.mobile : CHART_MARGINS.desktop;

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
                    theme={nivoTheme}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                    }}
                    enablePoints={true}
                    pointSize={8}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    enableArea={enableArea}
                    areaOpacity={0.15}
                    useMesh={true}
                    enableSlices='x'
                    animate={true}
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
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={CHART_COLORS}
                    theme={nivoTheme}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor='var(--foreground)'
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    enableArcLabels={true}
                    enableArcLinkLabels={true}
                    animate={true}
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
