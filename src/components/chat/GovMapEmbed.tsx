'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ChevronDown, ExternalLinkIcon, LocateFixedIcon, MapIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shimmer } from '@/components/ai-elements/shimmer';
import type { DisplayGovmapInput } from '@/lib/tools/client/display-govmap.tool';
import { GOVMAP_PORTAL_BASE_URL } from '@/data-sources/govmap/api/govmap.endpoints';

function isValidGovmapUrl(url: string): boolean {
    try {
        return new URL(url).origin.includes(GOVMAP_PORTAL_BASE_URL.replace(/^https?:\/\//, ''));
    } catch {
        return false;
    }
}

/**
 * Strips the `bs` param from a GovMap portal URL for embedding. `bs`
 * auto-selects an entity and opens its popup, causing GovMap's JS to focus()
 * the popup element — the browser then scroll-into-views every ancestor scroll
 * container, jumping the page. No reliable cross-origin fix exists (open W3C
 * spec gap: w3c/csswg-drafts#7134). The layer entities are still rendered on
 * the map via the `lay` param; `bs` only auto-opens one entity's popup. The
 * full URL with `bs` is preserved for the "open in GovMap" external link.
 */
function buildEmbedUrl(url: string): string {
    try {
        const u = new URL(url);
        u.searchParams.delete('bs');
        return u.toString();
    } catch {
        return url;
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
    const [open, setOpen] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const embedUrl = useMemo(() => buildEmbedUrl(portalUrl), [portalUrl]);

    console.log({ embedUrl });

    const resetToOriginal = useCallback(() => {
        if (iframeRef.current) {
            iframeRef.current.src = embedUrl;
            setIsLoading(true);
        }
    }, [embedUrl]);

    if (!isValidGovmapUrl(portalUrl)) {
        return <GovMapEmbedError error='כתובת מפה לא תקינה' />;
    }

    const headerTitle = title || 'מפת GovMap';

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className='w-full overflow-hidden rounded-lg border border-border'
        >
            <div className='flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2'>
                <CollapsibleTrigger className='flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'>
                    <MapIcon className='h-4 w-4' />
                    <span>{headerTitle}</span>
                    <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <div className='flex items-center divide-x divide-border'>
                    {open && (
                        <button
                            type='button'
                            onClick={resetToOriginal}
                            className='flex cursor-pointer items-center gap-1 pe-2 text-xs text-muted-foreground transition-colors hover:text-foreground'
                        >
                            <span className='hidden sm:inline'>חזור למיקום</span>
                            <LocateFixedIcon className='h-3.5 w-3.5' />
                        </button>
                    )}
                    <a
                        href={portalUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1 ps-2 text-xs text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <span className='hidden sm:inline'>פתח ב-GovMap</span>
                        <ExternalLinkIcon className='h-3.5 w-3.5' />
                    </a>
                </div>
            </div>
            <CollapsibleContent>
                <div className='relative h-[400px] overflow-clip'>
                    {isLoading && (
                        <div className='absolute inset-0 z-10 flex items-center justify-center bg-muted/30'>
                            <Shimmer as='span' duration={1.5}>
                                טוען מפה...
                            </Shimmer>
                        </div>
                    )}
                    <iframe
                        ref={iframeRef}
                        src={embedUrl}
                        title={headerTitle}
                        className='h-full w-full'
                        sandbox='allow-scripts allow-same-origin allow-popups'
                        loading='lazy'
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
