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

export function AmbientGlow({ top = '0', left = '50%', size = 800, className }: AmbientGlowProps) {
    const half = size / 2;

    return (
        <>
            <div
                className={cn('pointer-events-none absolute z-[-5] rounded-full dark:hidden', className)}
                style={{
                    top,
                    left,
                    width: size,
                    height: size,
                    marginTop: -half,
                    marginLeft: -half,
                    background: 'radial-gradient(circle, oklch(0.80 0.10 250 / 0.2), transparent 70%)',
                }}
            />
            <div
                className={cn('pointer-events-none absolute z-[-5] rounded-full hidden dark:block', className)}
                style={{
                    top,
                    left,
                    width: size,
                    height: size,
                    marginTop: -half,
                    marginLeft: -half,
                    background: 'radial-gradient(circle, oklch(0.55 0.18 250 / 0.2), transparent 70%)',
                }}
            />
        </>
    );
}
