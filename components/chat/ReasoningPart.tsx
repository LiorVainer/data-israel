'use client';

import { LoadingShimmer } from '@/app/page';
import { Shimmer } from '@/components/ai-elements/shimmer';

export interface ReasoningPartProps {
  isCurrentlyReasoning: boolean;
}

export function ReasoningPart({ isCurrentlyReasoning }: ReasoningPartProps) {
  return isCurrentlyReasoning ? (<div className="py-2">
        <LoadingShimmer text='חושב...'/>
    </div>
      ) : null
}
