'use client';

import { StatCard } from './StatCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnswerRatingStatsProps {
    totalAnswers: number;
    totalRated: number;
    goodCount: number;
    badCount: number;
}

function pct(numerator: number, denominator: number): string {
    if (denominator === 0) return '0%';
    return `${Math.round((numerator / denominator) * 100)}%`;
}

export function AnswerRatingStats({ totalAnswers, totalRated, goodCount, badCount }: AnswerRatingStatsProps) {
    const isMobile = useIsMobile();

    return (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-4'}`}>
            <StatCard label='סה״כ תשובות' value={totalAnswers} />
            <StatCard label='דורגו' value={totalRated} subtitle={`${pct(totalRated, totalAnswers)} מהתשובות`} />
            <StatCard label='טוב 👍' value={goodCount} subtitle={pct(goodCount, totalRated)} />
            <StatCard label='לא טוב 👎' value={badCount} subtitle={pct(badCount, totalRated)} />
        </div>
    );
}
