'use client';

import { Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { ExternalLinkIcon } from 'lucide-react';
import type { SourceUrlUIPart } from './types';

export interface SourcesPartProps {
    sources: SourceUrlUIPart[];
}

export function SourcesPart({ sources }: SourcesPartProps) {
    if (sources.length === 0) return null;

    return (
        <Sources>
            <SourcesTrigger count={sources.length}>
                <span className='font-medium'>המידע הגיע מ-{sources.length} מקורות</span>
            </SourcesTrigger>
            <SourcesContent className='w-full flex-row flex-wrap'>
                {sources.map((source) => (
                    <a
                        key={source.sourceId}
                        href={source.url}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                    >
                        <span className='max-w-48 truncate'>{source.title ?? new URL(source.url).hostname}</span>
                        <ExternalLinkIcon className='h-3 w-3 shrink-0' />
                    </a>
                ))}
            </SourcesContent>
        </Sources>
    );
}
