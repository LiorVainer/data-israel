'use client';

import { PromptSuggestions } from './PromptSuggestions';
import { HeroBadge, HeroTitle, HeroSubtitle } from '@/components/ui/shape-landing-hero';

export interface EmptyConversationProps {
    onSuggestionClick: (prompt: string) => void;
}

export function EmptyConversation({ onSuggestionClick }: EmptyConversationProps) {
    return (
        <div className='w-full max-w-2xl mx-auto px-4 text-center flex flex-col items-center flex-1 min-h-0'>
            <div className='flex-shrink-0 pt-8'>
                <HeroBadge>data.gov.il</HeroBadge>
                <HeroTitle line1='שאל על נתונים' line2='פתוחים ישראליים' />
                <HeroSubtitle>חפש מאגרי מידע, חקור קטגוריות וגלה נתונים ציבוריים</HeroSubtitle>
            </div>

            <div className='w-full flex-1 min-h-32 overflow-y-auto mt-4 flex flex-col items-center'>
                <div className='text-muted-foreground font-medium mb-3 text-center flex-shrink-0'>
                    דוגמאות לשאלות:
                </div>
                <PromptSuggestions onSuggestionClick={onSuggestionClick} />
            </div>
        </div>
    );
}
