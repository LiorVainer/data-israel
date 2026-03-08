'use client';

import { LoadingShimmer } from '@/components/chat/LoadingShimmer';

export interface ReasoningPartProps {
    isCurrentlyReasoning: boolean;
}

export function ReasoningPart({ isCurrentlyReasoning }: ReasoningPartProps) {
    return isCurrentlyReasoning ? <LoadingShimmer text='חושב...' /> : null;
}
