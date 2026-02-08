import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { InputSection } from '@/components/chat/InputSection';
import { MessageListSkeleton } from '@/components/chat/MessageListSkeleton';

export default function ChatLoading() {
    return (
        <div className='relative h-dvh w-screen'>
            <GeometricBackground noShapes />

            <div className='mx-auto px-4 md:px-0 pb-4 md:pb-6 relative h-full'>
                <div className='flex flex-col gap-4 md:gap-6 h-full w-full items-center'>
                    {/* Message area skeleton */}
                    <div className='flex-1 w-full md:w-4xl pt-12 md:pt-10 mx-auto overflow-hidden'>
                        <MessageListSkeleton />
                    </div>

                    {/* Disabled input at bottom */}
                    <div className='relative z-20 w-full md:w-4xl'>
                        <InputSection status='submitted' />
                    </div>
                </div>
            </div>
        </div>
    );
}
