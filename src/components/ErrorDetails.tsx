'use client';

import { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface ErrorDetailsProps {
    error: Error & { digest?: string };
}

/**
 * Collapsible error details panel with copy button.
 * Shows error name, message, digest, and stack trace in a
 * non-scary dropdown that users can expand and copy for reporting.
 */
export function ErrorDetails({ error }: ErrorDetailsProps) {
    const [copied, setCopied] = useState(false);

    const errorText = [
        `${error.name}: ${error.message}`,
        error.digest ? `Digest: ${error.digest}` : null,
        error.stack ? `\nStack:\n${error.stack}` : null,
    ]
        .filter(Boolean)
        .join('\n');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(errorText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers that don't support clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = errorText;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Collapsible className='w-full'>
            <CollapsibleTrigger className='flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50'>
                <span>פרטי השגיאה</span>
                <ChevronDown className='h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]_&]:rotate-180' />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className='mt-2 rounded-lg border border-border/60 bg-muted/30 p-3'>
                    <div className='mb-2 flex items-center justify-between'>
                        <span className='text-xs font-medium text-muted-foreground'>מידע טכני</span>
                        <Button variant='ghost' size='sm' onClick={() => void handleCopy()} className='h-7 gap-1.5 px-2 text-xs'>
                            {copied ? (
                                <>
                                    <Check className='h-3 w-3' />
                                    <span>הועתק</span>
                                </>
                            ) : (
                                <>
                                    <Copy className='h-3 w-3' />
                                    <span>העתק</span>
                                </>
                            )}
                        </Button>
                    </div>
                    <pre
                        dir='ltr'
                        className='max-h-40 overflow-auto rounded-md bg-background/80 p-2.5 text-[11px] leading-relaxed text-muted-foreground'
                    >
                        {errorText}
                    </pre>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
