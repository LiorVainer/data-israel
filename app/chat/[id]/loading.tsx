import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { Skeleton } from '@/components/ui/skeleton';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';
import { CornerDownLeftIcon } from 'lucide-react';

function MessageSkeleton({ isUser }: { isUser: boolean }) {
    return (
        <div className={`flex ${isUser ? 'justify-start' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] ${isUser ? 'mr-auto' : 'mr-auto'}`}>
                {isUser ? (
                    <Skeleton className='h-10 w-48 rounded-2xl' />
                ) : (
                    <div className='space-y-2'>
                        <Skeleton className='h-4 w-64' />
                        <Skeleton className='h-4 w-56' />
                        <Skeleton className='h-4 w-40' />
                    </div>
                )}
            </div>
        </div>
    );
}

function DisabledInput() {
    return (
        <div className='opacity-50 pointer-events-none'>
            <InputGroup className='overflow-hidden bg-background'>
                <InputGroupTextarea
                    className='field-sizing-content max-h-48 min-h-16'
                    placeholder='שאל על מאגרי מידע'
                    disabled
                />
                <InputGroupAddon align='block-end' className='justify-end gap-1'>
                    <InputGroupButton
                        aria-label='Submit'
                        size='icon-sm'
                        type='button'
                        variant='default'
                        disabled
                    >
                        <CornerDownLeftIcon className='size-4' />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
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
                        <div className='space-y-6 animate-pulse'>
                            <MessageSkeleton isUser />
                            <MessageSkeleton isUser={false} />
                        </div>
                    </div>

                    {/* Disabled input at bottom */}
                    <div className='relative z-20 w-full md:w-4xl'>
                        <DisabledInput />
                    </div>
                </div>
            </div>
        </div>
    );
}
