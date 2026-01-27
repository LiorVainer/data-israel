'use client';

import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import type { SourceUrlUIPart } from './types';

export interface SourcesPartProps {
    sources: SourceUrlUIPart[];
}

export function SourcesPart({ sources }: SourcesPartProps) {
    if (sources.length === 0) return null;

    return (
        <Sources>
            <SourcesTrigger count={sources.length}>
                <span className='font-medium'>השתמש ב-{sources.length} מקורות</span>
            </SourcesTrigger>
            <SourcesContent>
                {sources.map((source) => (
                    <Source
                        key={source.sourceId}
                        href={source.url}
                        title={source.title ?? new URL(source.url).hostname}
                    />
                ))}
            </SourcesContent>
        </Sources>
    );
}
