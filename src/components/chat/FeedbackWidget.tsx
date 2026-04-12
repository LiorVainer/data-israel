'use client';

import { memo } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackWidgetProps {
    currentRating: 'good' | 'bad' | null;
    onRate: (rating: 'good' | 'bad') => void;
}

export const FeedbackWidget = memo(function FeedbackWidget({ currentRating, onRate }: FeedbackWidgetProps) {
    return (
        <div className='mt-2 flex items-center gap-1.5'>
            <button
                type='button'
                aria-pressed={currentRating === 'good'}
                onClick={() => onRate('good')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                    currentRating === 'good'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
                <ThumbsUp className='size-3' />
                <span>עזר לי</span>
            </button>
            <button
                type='button'
                aria-pressed={currentRating === 'bad'}
                onClick={() => onRate('bad')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                    currentRating === 'bad'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
                <ThumbsDown className='size-3' />
                <span>לא עזר</span>
            </button>
        </div>
    );
});
