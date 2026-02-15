'use client';

import type { CSSProperties } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContextWindowIndicatorProps {
    usedTokens: number;
    maxTokens: number;
}

const THRESHOLDS = {
    WARNING: 70,
    CRITICAL: 90,
} as const;

const INDICATOR_COLORS = {
    WARNING: 'oklch(0.769 0.188 70.08)',
    CRITICAL: 'oklch(0.637 0.237 25.331)',
} as const;

function getPercentage(used: number, max: number): number {
    return Math.min(Math.round((used / max) * 100), 100);
}

function getIndicatorStyle(percentage: number): CSSProperties | undefined {
    if (percentage >= THRESHOLDS.CRITICAL) {
        return { '--primary': INDICATOR_COLORS.CRITICAL } as CSSProperties;
    }
    if (percentage >= THRESHOLDS.WARNING) {
        return { '--primary': INDICATOR_COLORS.WARNING } as CSSProperties;
    }
    return undefined;
}

export function ContextWindowIndicator({ usedTokens, maxTokens }: ContextWindowIndicatorProps) {
    const percentage = getPercentage(usedTokens, maxTokens);
    const indicatorStyle = getIndicatorStyle(percentage);
    const isWarning = percentage >= THRESHOLDS.WARNING;
    const isMobile = useIsMobile();

    return (
        <div className={cn('flex gap-1.5 flex-col w-full sm:justify-end items-end px-1')}>
            <div className='flex gap-1 md:gap-4 items-end md:items-center flex-col md:flex-row sm:justify-end'>
                <div className='flex text-xs text-muted-foreground sm:justify-end' dir='rtl'>
                    <span className='whitespace-nowrap'>{percentage}% מכמות המילים המקסימלית לשיחה נוצלו</span>
                </div>
                <Progress value={percentage} style={indicatorStyle} />
            </div>
            {isWarning && (
                <p className='text-xs text-amber-600 dark:text-amber-400 sm:text-left' dir='rtl'>
                    אחוז גבוה עלול לגרום לירידה באיכות התשובות. מומלץ לפתוח שיחה חדשה.
                </p>
            )}
        </div>
    );
}
