'use client';

import { MessageAction, MessageActions } from '@/components/ai-elements/message';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { memo } from 'react';

interface FeedbackWidgetProps {
    currentRating: 'good' | 'bad' | null;
    onRate: (rating: 'good' | 'bad') => void;
}

export const FeedbackWidget = memo(function FeedbackWidget({ currentRating, onRate }: FeedbackWidgetProps) {
    return (
        <MessageActions className='mt-2'>
            <MessageAction
                aria-pressed={currentRating === 'good'}
                onClick={() => onRate('good')}
                size='sm'
                className={`border border-border text-muted-foreground ${currentRating === 'good' ? 'bg-muted text-foreground' : ''}`}
            >
                <ThumbsUp className='size-3.5' />
                <span>עזר</span>
            </MessageAction>
            <MessageAction
                aria-pressed={currentRating === 'bad'}
                onClick={() => onRate('bad')}
                size='sm'
                className={`border border-border text-muted-foreground ${currentRating === 'bad' ? 'bg-muted text-foreground' : ''}`}
            >
                <ThumbsDown className='size-3.5' />
                <span>לא עזר</span>
            </MessageAction>
        </MessageActions>
    );
});
