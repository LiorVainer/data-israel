'use client';

import { TrendingUpIcon, Building2Icon, CarIcon, HomeIcon } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

interface PromptCard {
    label: string;
    prompt: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const PROMPT_CARDS: PromptCard[] = [
    {
        label: 'מחירים ומדדים',
        prompt: 'איך השתנה סל יוקר המחיה בישראל בעשור האחרון, ואילו סעיפים התייקרו הכי הרבה?',
        icon: TrendingUpIcon,
    },
    {
        label: 'דירוג יישובים',
        prompt: 'אילו יישובים בישראל מדורגים הכי גבוה במדד הסוציו-אקונומי, ומה מאפיין אותם?',
        icon: Building2Icon,
    },
    {
        label: 'רכבים חשמליים',
        prompt: 'איך השתנה מספר הרכבים החשמליים בישראל ב-5 השנים האחרונות לעומת רכבי בנזין?',
        icon: CarIcon,
    },
    {
        label: 'מחירי דיור',
        prompt: 'באילו ערים במרכז יש את היחס הכי טוב בין שכר ממוצע למחירי דירות 3 חדרים?',
        icon: HomeIcon,
    },
];

interface EmptyConversationProps {
    onClick: (prompt: string) => void;
}

export function EmptyConversation({ onClick }: EmptyConversationProps) {
    return (
        <div className='flex flex-col items-center gap-6 py-16 md:py-24 px-2' dir='rtl'>
            <div className='text-center space-y-2'>
                <h2 className='text-xl md:text-2xl font-semibold text-foreground/90'>
                    במה אוכל לעזור?
                </h2>
                <p className='text-sm text-muted-foreground'>
                    בחרו נושא או הקלידו שאלה חופשית
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl'>
                {PROMPT_CARDS.map((card) => (
                    <button
                        key={card.label}
                        type='button'
                        onClick={() => onClick(card.prompt)}
                        className='group flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-right transition-all hover:border-border hover:bg-card/80 hover:shadow-sm cursor-pointer'
                    >
                        <div className='flex items-center gap-2'>
                            <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60'>
                                <card.icon className='size-4 text-muted-foreground' />
                            </div>
                            <span className='text-sm font-medium text-foreground/80'>
                                {card.label}
                            </span>
                        </div>
                        <p className='text-[13px] leading-relaxed text-muted-foreground line-clamp-3'>
                            {card.prompt}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
