import { Skeleton } from '@/components/ui/skeleton';

function UserMessageSkeleton() {
    return (
        <div className='flex w-full flex-col gap-2'>
            <div className='flex w-fit max-w-full min-w-0 flex-col gap-2 rounded-lg bg-secondary px-4 py-3'>
                <Skeleton className='h-4 w-32 bg-muted-foreground/20' />
            </div>
        </div>
    );
}

function AssistantMessageSkeleton() {
    return (
        <div className='flex w-full flex-col gap-2'>
            <div className='flex w-full min-w-0 flex-col gap-2'>
                <div className='space-y-2 w-full'>
                    <Skeleton className='h-4 w-[90%]' />
                    <Skeleton className='h-4 w-[96%]' />
                    <Skeleton className='h-4 w-[86%]' />
                </div>
            </div>
        </div>
    );
}

export function MessageListSkeleton() {
    return (
        <div className='space-y-12 animate-pulse'>
            <UserMessageSkeleton />
            <div className='space-y-6'>
                <AssistantMessageSkeleton />
                <AssistantMessageSkeleton />
            </div>
        </div>
    );
}
