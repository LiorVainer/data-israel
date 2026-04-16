'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { AnswerEntry } from '@/convex/analytics';

interface AnswersListProps {
    data: AnswerEntry[];
}

const RATING_BADGE: Record<'good' | 'bad', string> = {
    good: '👍',
    bad: '👎',
};

function formatDate(ts: number): string {
    return new Date(ts).toLocaleString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function AnswersList({ data }: AnswersListProps) {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const filtered = search
        ? data.filter(
              (d) =>
                  d.userPrompt.toLowerCase().includes(search.toLowerCase()) ||
                  d.assistantResponse.toLowerCase().includes(search.toLowerCase()),
          )
        : data;

    function toggleExpand(id: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return (
        <div>
            <h3 className='mb-3 text-sm font-medium text-muted-foreground'>תשובות ושאלות ({filtered.length})</h3>
            <div className='relative mb-3'>
                <Search className='absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='חיפוש בשאלות ותשובות...'
                    className='pr-10'
                    dir='rtl'
                />
            </div>
            <div className='max-h-[500px] overflow-y-auto rounded-md border divide-y divide-border'>
                {filtered.length === 0 ? (
                    <div className='flex h-20 items-center justify-center text-sm text-muted-foreground'>
                        {search ? 'לא נמצאו תוצאות' : 'אין נתונים'}
                    </div>
                ) : (
                    filtered.map((entry) => {
                        const id = entry.answerId;
                        const isExpanded = expanded.has(id);
                        return (
                            <div key={id} className='px-3 py-3 hover:bg-muted/30 transition-colors space-y-2'>
                                {/* Header row: timestamp + rating badge */}
                                <div className='flex items-center justify-between gap-2'>
                                    <span className='text-xs text-muted-foreground'>{formatDate(entry.createdAt)}</span>
                                    {entry.rating !== null ? (
                                        <span className='text-base leading-none'>{RATING_BADGE[entry.rating]}</span>
                                    ) : (
                                        <span className='text-xs text-muted-foreground/50'>—</span>
                                    )}
                                </div>

                                {/* Question */}
                                <div>
                                    <p className='mb-0.5 text-xs font-medium text-muted-foreground'>שאלה</p>
                                    <p
                                        dir='rtl'
                                        onClick={() => toggleExpand(`q-${id}`)}
                                        className={[
                                            'cursor-pointer text-sm text-foreground leading-relaxed select-none',
                                            expanded.has(`q-${id}`) ? '' : 'line-clamp-2',
                                        ].join(' ')}
                                    >
                                        {entry.userPrompt}
                                    </p>
                                </div>

                                {/* Answer */}
                                <div>
                                    <p className='mb-0.5 text-xs font-medium text-muted-foreground'>תשובה</p>
                                    <p
                                        dir='rtl'
                                        onClick={() => toggleExpand(`a-${id}`)}
                                        className={[
                                            'cursor-pointer text-sm text-foreground/80 leading-relaxed select-none',
                                            expanded.has(`a-${id}`) ? '' : 'line-clamp-3',
                                        ].join(' ')}
                                    >
                                        {entry.assistantResponse}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
