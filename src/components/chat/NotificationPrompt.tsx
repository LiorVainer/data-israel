'use client';

/**
 * Hebrew RTL banner prompting the user to enable push notifications.
 *
 * Visibility conditions (ALL must be true):
 * - isSupported: browser supports push API and VAPID is configured
 * - !isSubscribed: user is not already subscribed
 * - hasMessages: user has sent at least one message (contextual prompt)
 * - not previously dismissed (localStorage key: 'notification-prompt-dismissed')
 */

import { memo, useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';

const DISMISSED_KEY = 'notification-prompt-dismissed';

interface NotificationPromptProps {
    isSupported: boolean;
    isSubscribed: boolean;
    subscribe: () => Promise<void>;
    unsubscribe: () => Promise<void>;
    hasMessages: boolean;
}

export const NotificationPrompt = memo(function NotificationPrompt({
    isSupported,
    isSubscribed,
    subscribe,
    hasMessages,
}: NotificationPromptProps) {
    const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash
    const [isSubscribing, setIsSubscribing] = useState(false);

    // Read localStorage on mount (client-only).
    // Wrapped in try-catch because localStorage throws in Safari private browsing.
    useEffect(() => {
        try {
            const dismissed = localStorage.getItem(DISMISSED_KEY);
            if (!dismissed) {
                setIsDismissed(false);
            }
        } catch {
            // localStorage unavailable (e.g. Safari private mode) — show prompt (non-persistent)
            setIsDismissed(false);
        }
    }, []);

    const shouldShow = isSupported && !isSubscribed && hasMessages && !isDismissed;

    if (!shouldShow) {
        return null;
    }

    const handleDismiss = () => {
        try {
            localStorage.setItem(DISMISSED_KEY, 'true');
        } catch {
            // localStorage unavailable — dismiss for this session only
        }
        setIsDismissed(true);
    };

    const handleSubscribe = async () => {
        setIsSubscribing(true);
        try {
            await subscribe();
        } finally {
            setIsSubscribing(false);
        }
    };

    return (
        <div
            role='region'
            aria-label='הפעל התראות'
            className='flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-sm backdrop-blur-sm'
        >
            <div className='flex items-center gap-2 text-muted-foreground'>
                <BellRing className='h-4 w-4 shrink-0 text-primary/70' aria-hidden='true' />
                <span>רוצה לקבל התראה כשהתשובה מוכנה?</span>
            </div>

            <div className='flex items-center gap-2 shrink-0'>
                <button
                    type='button'
                    onClick={() => void handleSubscribe()}
                    disabled={isSubscribing}
                    className='rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50'
                    aria-busy={isSubscribing}
                >
                    {isSubscribing ? '...' : 'הפעל התראות'}
                </button>

                <button
                    type='button'
                    onClick={handleDismiss}
                    aria-label='סגור'
                    className='rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                >
                    <X className='h-3.5 w-3.5' aria-hidden='true' />
                </button>
            </div>
        </div>
    );
});
