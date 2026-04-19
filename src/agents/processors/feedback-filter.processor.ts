import type { Processor } from '@mastra/core/processors';
import type { ChunkType } from '@mastra/core/stream';
import { DELEGATION_FEEDBACK_TEXT } from '@/constants/chat';

export class FeedbackFilterProcessor implements Processor {
    readonly id = 'feedback-filter';

    async processOutputStream({ part }: { part: ChunkType }): Promise<ChunkType | null> {
        if (part.type === 'text-delta' && part.payload.text.includes(DELEGATION_FEEDBACK_TEXT)) {
            return null;
        }
        return part;
    }
}
