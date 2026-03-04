import { formatPrice } from '@/constants/admin';
import { cn } from '@/lib/utils';

interface ModelPriceDisplayProps {
    inputPrice?: number;
    outputPrice?: number;
    className?: string;
}

export function ModelPriceDisplay({ inputPrice, outputPrice, className }: ModelPriceDisplayProps) {
    if (inputPrice === undefined && outputPrice === undefined) return null;

    return (
        <span className={cn('text-muted-foreground flex items-center gap-1 text-[11px] tabular-nums', className)}>
            <span className='text-blue-500' title='Input per 1M tokens'>
                {formatPrice(inputPrice)}
            </span>
            <span className='text-muted-foreground/50'>|</span>
            <span className='text-orange-500' title='Output per 1M tokens'>
                {formatPrice(outputPrice)}
            </span>
        </span>
    );
}
