'use client';

import { PromptSuggestions } from './PromptSuggestions';
import { HeroBadge, HeroSubtitle, HeroTitle } from '@/components/ui/shape-landing-hero';
import { useIsMobile } from '@/hooks/use-mobile';

export interface LandingPageProps {
    onSuggestionClick: (prompt: string) => void;
}

export function LandingPage({ onSuggestionClick }: LandingPageProps) {
    const isMobile = useIsMobile();

    return (
        <div className='w-full max-w-4xl mx-auto px-4 text-center flex flex-col items-center justify-center flex-1 min-h-0 gap-4 md:gap-8'>
            <div className='flex-shrink-0 flex flex-col items-center gap-4'>
                <HeroTitle line1='חפש מידע ציבורי' line2='ממאגרי הממשלה' />
                <div>
                    <HeroSubtitle>חפש מאגרי מידע ונתונים ציבוריים</HeroSubtitle>
                    <HeroSubtitle>מהמאגר הרשמי של ממשלת ישראל</HeroSubtitle>
                </div>
                <HeroBadge>data.gov.il</HeroBadge>
            </div>

            {!isMobile && (
                <div className='w-full min-h-32 overflow-y-auto mt-4 flex flex-col items-center'>
                    <div className='text-muted-foreground font-medium mb-3 text-center flex-shrink-0'>דוגמאות לשאלות:</div>
                    <PromptSuggestions onSuggestionClick={onSuggestionClick} />
                </div>
            )}
        </div>
    );
}
