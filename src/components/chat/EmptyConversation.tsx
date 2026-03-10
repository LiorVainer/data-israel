'use client';

import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import { PROMPT_CARDS } from '@/constants/prompt-cards';

interface EmptyConversationProps {
    onClick: (prompt: string) => void;
}

export function EmptyConversation({ onClick }: EmptyConversationProps) {
    return (
        <div className='flex flex-col gap-4 md:gap-12 h-full items-center justify-center w-fit' dir='rtl'>
            <div className='shrink-0 text-right space-y-2 self-start'>
                <h2 className='text-xl md:text-2xl font-semibold text-foreground/90'>איזה נתון תרצה לבדוק?</h2>
                <p className='text-sm text-muted-foreground'>שאלו שאלה על נתונים ציבוריים של ישראל.</p>
            </div>

            <div className='min-h-0 overflow-y-auto'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 w-full'>
                    {PROMPT_CARDS.map((card) => (
                        <button
                            key={card.label}
                            type='button'
                            onClick={() => onClick(card.prompt)}
                            className='group flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-right transition-all hover:border-border hover:bg-card/80 hover:shadow-sm'
                        >
                            <div className='flex items-center gap-2'>
                                <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-tint'>
                                    <card.icon className='size-4 text-primary' />
                                </div>
                                <span className='text-sm font-medium text-foreground/80'>{card.label}</span>
                            </div>
                            <p className='text-[13px] leading-relaxed text-muted-foreground line-clamp-3'>
                                {card.prompt}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className='shrink-0'>
                <AiDisclaimer />
            </div>
        </div>
    );
}
