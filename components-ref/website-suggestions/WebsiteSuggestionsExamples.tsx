import { PROMPTS_EXAMPLES } from '@/constants/prompts.const';
import { Button } from '@/components/ui/button';

export type WebsiteSuggestionsExamplesProps = {
    onExamplePress: (prompt: string) => void;
};

export const WebsiteSuggestionsExamples = ({ onExamplePress }: WebsiteSuggestionsExamplesProps) => (
    <div className='grid @xl/main:grid-cols-2 gap-4'>
        {Object.entries(PROMPTS_EXAMPLES).map(([subject, prompt]) => (
            <Button
                onClick={() => {
                    onExamplePress(prompt);
                }}
                variant='ghost'
                className='h-[100px] bg-background/30 dark:hover:bg-background/50 dark:border-background/40 bg-none flex flex-col border-1 flex-wrap items-start'
                key={subject}
            >
                <h2 className='text-sm font-semibold text-forground/70 -800'>{subject}</h2>
                <p className='text-xs text-muted-foreground break-words whitespace-normal leading-snug line-clamp-4 text-left'>
                    {prompt}
                </p>
            </Button>
        ))}
    </div>
);
