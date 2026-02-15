import { Shimmer } from '@/components/ai-elements/shimmer';
import { DataIsraelLoader } from './DataIsraelLoader';

interface LoadingShimmerProps {
    text?: string;
    showIcon?: boolean;
}

export function LoadingShimmer({ text = 'מעבד את הבקשה שלך...', showIcon = true }: LoadingShimmerProps) {
    return (
        <div className='flex items-center gap-3 animate-in fade-in duration-300'>
            {showIcon && <DataIsraelLoader size={18} />}
            <div className='flex-1'>
                <Shimmer as='p' className='py-2' duration={1.5}>
                    {text}
                </Shimmer>
            </div>
        </div>
    );
}
