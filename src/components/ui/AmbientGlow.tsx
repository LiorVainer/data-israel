import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AmbientGlowProps {
    /** CSS top position (e.g. '10%', '200px'). Default: '0' */
    top?: string;
    /** CSS left position (e.g. '20%', '100px'). Default: '50%' */
    left?: string;
    /** Size of the glow in px. Default: 800 */
    size?: number;
    className?: string;
}

const LIGHT_BACKGROUND = 'radial-gradient(circle, oklch(0.80 0.10 250 / 0.2), transparent 70%)';
const DARK_BACKGROUND = 'radial-gradient(circle, oklch(0.55 0.18 250 / 0.2), transparent 70%)';

export const AmbientGlow = memo(function AmbientGlow({
    top = '0',
    left = '50%',
    size = 800,
    className,
}: AmbientGlowProps) {
    const half = size / 2;

    const lightStyle = useMemo(
        () => ({
            top,
            left,
            width: size,
            height: size,
            marginTop: -half,
            marginLeft: -half,
            background: LIGHT_BACKGROUND,
        }),
        [top, left, size, half],
    );

    const darkStyle = useMemo(
        () => ({
            top,
            left,
            width: size,
            height: size,
            marginTop: -half,
            marginLeft: -half,
            background: DARK_BACKGROUND,
        }),
        [top, left, size, half],
    );

    return (
        <>
            <div
                className={cn('pointer-events-none absolute z-5 rounded-full dark:hidden', className)}
                style={lightStyle}
            />
            <div
                className={cn('pointer-events-none absolute z-[-5] rounded-full hidden dark:block', className)}
                style={darkStyle}
            />
        </>
    );
});
