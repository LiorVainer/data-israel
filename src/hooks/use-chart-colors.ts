'use client';

import { useEffect, useState } from 'react';

const CHART_CSS_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

/** Fallback hex colors approximating the oklch theme values */
const FALLBACK_COLORS = ['#3b6cf6', '#2da866', '#8b5cf6', '#e67e22', '#0891b2'];

/**
 * Resolves chart CSS custom properties to actual color strings at runtime.
 * Observes theme (class) changes on <html> to re-resolve for dark/light mode.
 */
export function useChartColors(): string[] {
    const [colors, setColors] = useState<string[]>(FALLBACK_COLORS);

    useEffect(() => {
        function resolve() {
            const style = getComputedStyle(document.documentElement);
            const resolved = CHART_CSS_VARS.map((varName, i) => {
                const val = style.getPropertyValue(varName).trim();
                return val || FALLBACK_COLORS[i];
            });
            setColors(resolved);
        }

        resolve();

        // Re-resolve when theme toggles (dark class on <html>)
        const observer = new MutationObserver(() => resolve());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return colors;
}
