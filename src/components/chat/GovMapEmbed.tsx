'use client';

import { useState } from 'react';
import { ExternalLinkIcon, MapIcon } from 'lucide-react';
import { Shimmer } from '@/components/ai-elements/shimmer';
import type { DisplayGovmapInput } from '@/lib/tools/client/display-govmap.tool';

const GOVMAP_ORIGIN = 'https://www.govmap.gov.il';

function isValidGovmapUrl(url: string): boolean {
    try {
        return new URL(url).origin === GOVMAP_ORIGIN;
    } catch {
        return false;
    }
}

export function GovMapEmbedLoading() {
    return (
        <div className='flex h-[400px] w-full items-center justify-center rounded-lg border border-border bg-muted/30'>
            <Shimmer as='span' duration={1.5}>
                טוען מפה...
            </Shimmer>
        </div>
    );
}

export function GovMapEmbedError({ error }: { error?: string }) {
    return (
        <div className='flex h-[200px] w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'>
            <p className='text-error text-sm'>{error || 'שגיאה בהצגת המפה'}</p>
        </div>
    );
}

export function GovMapEmbed({ portalUrl, title }: DisplayGovmapInput) {
    const [isLoading, setIsLoading] = useState(true);

    if (!isValidGovmapUrl(portalUrl)) {
        return <GovMapEmbedError error='כתובת מפה לא תקינה' />;
    }

    return (
        <div className='w-full overflow-hidden rounded-lg border border-border'>
            {title && (
                <div className='flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2'>
                    <div className='flex items-center gap-2 text-sm font-medium'>
                        <MapIcon className='h-4 w-4 text-muted-foreground' />
                        <span>{title}</span>
                    </div>
                    <a
                        href={portalUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <span>פתח ב-GovMap</span>
                        <ExternalLinkIcon className='h-3 w-3' />
                    </a>
                </div>
            )}
            <div className='relative'>
                {isLoading && (
                    <div className='absolute inset-0 z-10 flex items-center justify-center bg-muted/30'>
                        <Shimmer as='span' duration={1.5}>
                            טוען מפה...
                        </Shimmer>
                    </div>
                )}
                <iframe
                    src={portalUrl}
                    title={title || 'מפת GovMap'}
                    className='h-[400px] w-full'
                    sandbox='allow-scripts allow-same-origin allow-popups'
                    loading='lazy'
                    onLoad={() => setIsLoading(false)}
                />
            </div>
            {!title && (
                <div className='flex justify-end border-t border-border px-3 py-1.5'>
                    <a
                        href={portalUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <span>פתח ב-GovMap</span>
                        <ExternalLinkIcon className='h-3 w-3' />
                    </a>
                </div>
            )}
        </div>
    );
}
