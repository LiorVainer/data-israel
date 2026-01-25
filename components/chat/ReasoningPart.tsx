'use client';

import { Shimmer } from '@/components/ai-elements/shimmer';

export interface ReasoningPartProps {
  isCurrentlyReasoning: boolean;
}

export function ReasoningPart({ isCurrentlyReasoning }: ReasoningPartProps) {
  return isCurrentlyReasoning ? (<div className="py-2">
        <Shimmer as="span" className="text-sm text-muted-foreground" duration={1.5}>
          חושב...
        </Shimmer>
    </div>
      ) : null
}
