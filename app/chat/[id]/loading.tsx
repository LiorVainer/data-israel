import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { Skeleton } from '@/components/ui/skeleton';
import { InputSection } from '@/components/chat/InputSection';

function UserMessageSkeleton() {
    return (
        <div className='flex w-full flex-col gap-2'>
            <div className='flex w-fit max-w-full min-w-0 flex-col gap-2 rounded-lg bg-background border px-4 py-3'>
                <Skeleton className='h-4 w-32 bg-muted-foreground/20' />
            </div>
        </div>
    );
}

function AssistantMessageSkeleton() {
    return (
        <div className='flex w-full flex-col gap-2'>
            <div className='flex  w-full min-w-0 flex-col gap-2'>
                <div className='space-y-2 w-full'>
                    <Skeleton className='h-4 w-[90%]' />
                    <Skeleton className='h-4 w-[96%]' />
                    <Skeleton className='h-4 w-[86%]' />
                </div>
            </div>
        </div>
    );
}

export default function ChatLoading() {
    return (
        <div className='relative h-dvh w-screen'>
            <GeometricBackground noShapes />

            <div className='mx-auto px-4 md:px-0 pb-4 md:pb-6 relative h-full'>
                <div className='flex flex-col gap-4 md:gap-6 h-full w-full items-center'>
                    {/* Message area skeleton */}
                    <div className='flex-1 w-full md:w-4xl pt-8 md:pt-10 mx-auto overflow-hidden'>
                        <div className='space-y-12 animate-pulse'>
                            <UserMessageSkeleton />
                            <div className='space-y-6'>
                                <AssistantMessageSkeleton />
                                <AssistantMessageSkeleton />
                            </div>
                        </div>
                    </div>

                    {/* Disabled input at bottom */}
                    <div className='relative z-20 w-full md:w-4xl'>
                        <InputSection disabled />
                    </div>
                </div>
            </div>
        </div>
    );
}
