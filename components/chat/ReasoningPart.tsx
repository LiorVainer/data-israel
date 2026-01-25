'use client';

import { Shimmer } from '@/components/ai-elements/shimmer';

export interface ReasoningPartProps {
  isCurrentlyReasoning: boolean;
}

export function ReasoningPart({ isCurrentlyReasoning }: ReasoningPartProps) {
  return (
    <div className="py-2">
      {isCurrentlyReasoning ? (
        <Shimmer as="span" className="text-sm text-muted-foreground" duration={1.5}>
          חושב...
        </Shimmer>
      ) : null }
    </div>
  );
}
