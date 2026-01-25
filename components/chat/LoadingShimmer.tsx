import { Shimmer } from '@/components/ai-elements/shimmer';

export function LoadingShimmer({ text = 'מעבד את הבקשה שלך...' }: { text?: string }) {
    return (
        <div className='flex gap-3 animate-in fade-in duration-300'>
            <div className='flex-1'>
                <Shimmer as='p' duration={1.5}>
                    {text}
                </Shimmer>
            </div>
        </div>
    );
}
