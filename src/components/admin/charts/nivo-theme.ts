import type { PartialTheme } from '@nivo/theming';

/**
 * Shared Nivo theme that works with both light and dark mode.
 * Uses 'currentColor' for text fills so it inherits from CSS.
 */
export const nivoTheme: PartialTheme = {
    text: { fill: 'currentColor' },
    axis: {
        ticks: {
            text: { fill: 'currentColor', fontSize: 11 },
            line: { stroke: 'currentColor', strokeOpacity: 0.15 },
        },
        domain: { line: { stroke: 'currentColor', strokeOpacity: 0.2 } },
    },
    grid: { line: { stroke: 'currentColor', strokeOpacity: 0.1 } },
    legends: { text: { fill: 'currentColor', fontSize: 12 } },
    tooltip: {
        container: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: 13,
            padding: '8px 12px',
        },
    },
};
