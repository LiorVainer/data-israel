import { PROMPTS_EXAMPLES } from '@/constants/prompts';
import { Button } from '@/components/ui/button';

export type PromptSuggestionsProps = {
    onSuggestionClick: (prompt: string) => void;
};

export const PromptSuggestions = ({ onSuggestionClick }: PromptSuggestionsProps) => (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {Object.entries(PROMPTS_EXAMPLES).map(([subject, prompt]) => (
            <Button
                onClick={() => {
                    onSuggestionClick(prompt);
                }}
                variant='ghost'
                className='h-[100px]  dark:hover:bg-background/50 dark:border-background/40 bg-none flex flex-col border flex-wrap items-start justify-start p-4'
                key={subject}
            >
                <h2 className='text-sm font-semibold text-foreground/70'>{subject}</h2>
                <p className='text-xs text-muted-foreground break-words whitespace-normal leading-snug line-clamp-4 text-right'>
                    {prompt}
                </p>
            </Button>
        ))}
    </div>
);
