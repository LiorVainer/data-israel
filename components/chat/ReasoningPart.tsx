'use client';

import { LoadingShimmer } from '@/components/chat/LoadingShimmer';

export interface ReasoningPartProps {
    isCurrentlyReasoning: boolean;
}

export function ReasoningPart({ isCurrentlyReasoning }: ReasoningPartProps) {
    return isCurrentlyReasoning ? (
        <div className='py-2'>
            <LoadingShimmer text='חושב...' />
        </div>
    ) : null;
}
