'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PROMPTS_EXAMPLES } from '@/constants/prompts';

const SKELETON_WIDTHS = ['w-32', 'w-44', 'w-36', 'w-40'] as const;

interface SuggestionsProps {
    onClick: (prompt: string) => void;
    suggestions?: string[];
    loading?: boolean;
}

export function Suggestions({ onClick, suggestions, loading }: SuggestionsProps) {
    if (loading) {
        return (
            <div className='flex w-full gap-2' dir='rtl'>
                {SKELETON_WIDTHS.map((w, i) => (
                    <Skeleton key={i} className={`${w} h-8 shrink-0 rounded-full`} />
                ))}
            </div>
        );
    }

    const items = suggestions ? suggestions.map((s) => [s, s] as const) : Object.entries(PROMPTS_EXAMPLES);

    return (
        <div
            className='w-full overflow-x-auto md:overflow-x-hidden md:overflow-y-hidden'
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
            <div
                className='flex w-max flex-nowrap gap-2 pb-2 md:grid md:w-full md:grid-cols-1 md:gap-2 max-h-24 md:overflow-y-auto md:snap-y md:snap-mandatory md:[scrollbar-width:thin] md:[scrollbar-color:var(--border)_transparent]'
                dir='rtl'
            >
                {items.map(([key, prompt]) => (
                    <Button
                        key={key}
                        variant='outline'
                        size='sm'
                        className='whitespace-nowrap rounded-full px-4 py-2 md:snap-start md:whitespace-normal md:h-full'
                        onClick={() => onClick(prompt)}
                    >
                        {prompt}
                    </Button>
                ))}
            </div>
        </div>
    );
}
