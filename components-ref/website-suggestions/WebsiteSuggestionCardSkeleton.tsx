import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const WebsiteSuggestionCardSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className='grid gap-4'>
        {Array.from({ length: count }).map((_, i) => (
            <Card key={i} className='p-4 gap-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <Skeleton className='h-6 w-6 rounded' />
                        <Skeleton className='h-4 w-48' />
                    </div>
                    <Skeleton className='h-6 w-6 rounded' />
                </div>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-3 w-5/6' />
                <div className='flex gap-2'>
                    <Skeleton className='h-5 w-12 rounded-full' />
                    <Skeleton className='h-5 w-16 rounded-full' />
                </div>
                <Skeleton className='h-3 w-1/3' />
            </Card>
        ))}
    </div>
);
