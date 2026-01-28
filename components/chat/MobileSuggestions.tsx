'use client';

import { Button } from '@/components/ui/button';
import { PROMPTS_EXAMPLES } from '@/constants/prompts';

interface MobileSuggestionsProps {
    onSuggestionClick: (prompt: string) => void;
}

export function MobileSuggestions({ onSuggestionClick }: MobileSuggestionsProps) {
    return (
        <div className='w-full overflow-x-auto scrollbar-none' style={{ scrollbarWidth: 'none' }}>
            <div className='flex gap-2 pb-2 w-max'>
                {Object.entries(PROMPTS_EXAMPLES).map(([subject, prompt]) => (
                    <Button
                        key={subject}
                        variant='outline'
                        size='sm'
                        className='whitespace-nowrap rounded-full px-4'
                        onClick={() => onSuggestionClick(prompt)}
                    >
                        {prompt}
                    </Button>
                ))}
            </div>
        </div>
    );
}
