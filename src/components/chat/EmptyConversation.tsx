'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import { DATA_SOURCES_CATEGORIES, type DataSourceCategory } from '@/data-sources/types';
import { getDataSourcesWithSuggestions } from '@/data-sources/registry';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Derived data (computed once at module level)
// ---------------------------------------------------------------------------

const sortedCategories = (
    Object.entries(DATA_SOURCES_CATEGORIES) as [
        DataSourceCategory,
        (typeof DATA_SOURCES_CATEGORIES)[DataSourceCategory],
    ][]
).sort(([, a], [, b]) => a.order - b.order);

const allSuggestions = getDataSourcesWithSuggestions();

interface SuggestionCard {
    label: string;
    prompt: string;
    icon: LucideIcon;
    sourceLabel: string;
    sourceIcon: LucideIcon;
}

/** Group suggestion prompts by data source category, flattening into cards with source metadata. */
const suggestionsByCategory: Record<DataSourceCategory, SuggestionCard[]> = Object.fromEntries(
    sortedCategories.map(([catId]) => {
        const cards: SuggestionCard[] = allSuggestions
            .filter((s) => s.category === catId)
            .flatMap((source) =>
                source.prompts.map((p) => ({
                    label: p.label,
                    prompt: p.prompt,
                    icon: p.icon,
                    sourceLabel: source.label,
                    sourceIcon: source.icon,
                })),
            );
        return [catId, cards];
    }),
) as Record<DataSourceCategory, SuggestionCard[]>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EmptyConversationProps {
    onClick: (prompt: string) => void;
}

export function EmptyConversation({ onClick }: EmptyConversationProps) {
    return (
        <div className='flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden gap-4' dir='rtl'>
            {/* Fixed header */}
            <div className='shrink-0 text-right space-y-2 pt-4 md:pt-8'>
                <h2 className='text-xl md:text-2xl font-semibold text-foreground/90'>איזה נתון תרצה לבדוק?</h2>
                <p className='text-sm text-muted-foreground'>שאלו שאלה על נתונים ציבוריים של ישראל.</p>
            </div>

            <Tabs
                defaultValue={sortedCategories[0]?.[0]}
                dir='rtl'
                className='w-full mt-4 md:mt-8 min-h-0 flex-1 flex flex-col'
            >
                {/* Fixed tabs */}
                <TabsList className='shrink-0 w-full justify-start md:justify-center mb-4 overflow-x-auto flex-nowrap'>
                    {sortedCategories.map(([id, cat]) => (
                        <TabsTrigger key={id} value={id} className='shrink-0'>
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Scrollable cards */}
                {sortedCategories.map(([catId]) => {
                    const cards = suggestionsByCategory[catId];
                    return (
                        <TabsContent key={catId} value={catId} className='min-h-0 flex-1 overflow-y-auto pb-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
                                {cards.map((card) => (
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
                                        <div className='flex items-center gap-1 mt-auto pt-1'>
                                            <card.sourceIcon className='size-3 text-muted-foreground/60' />
                                            <span className='text-[10px] text-muted-foreground/60'>
                                                {card.sourceLabel}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </TabsContent>
                    );
                })}
            </Tabs>

            <div className='shrink-0'>
                <AiDisclaimer />
            </div>
        </div>
    );
}
