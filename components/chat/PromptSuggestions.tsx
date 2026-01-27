import { PROMPTS_EXAMPLES } from '@/constants/prompts';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export type PromptSuggestionsProps = {
    onSuggestionClick: (prompt: string) => void;
};

export const PromptSuggestions = ({ onSuggestionClick }: PromptSuggestionsProps) => {
    const isMobile = useIsMobile();
    return (
        <div className='grid grid-cols-2 gap-4'>
            {Object.entries(PROMPTS_EXAMPLES)
                .slice(0, isMobile ? 2 : 4)
                .map(([subject, prompt]) => (
                    <Button
                        onClick={() => {
                            onSuggestionClick(prompt);
                        }}
                        variant='ghost'
                        className='h-auto min-h-[100px] dark:hover:bg-background/50 dark:border-background/40 bg-none flex flex-col border items-start justify-start p-4 overflow-hidden'
                        key={subject}
                    >
                        <h2 className='text-sm font-semibold text-foreground/70 break-words whitespace-normal text-right w-full'>
                            {subject}
                        </h2>
                        <p className='text-xs text-muted-foreground break-words whitespace-normal leading-snug line-clamp-4 text-right w-full'>
                            {prompt}
                        </p>
                    </Button>
                ))}
        </div>
    );
};
