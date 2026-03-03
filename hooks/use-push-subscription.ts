'use client';

/**
 * React hook for managing Web Push subscriptions.
 *
 * Registers the service worker on mount, checks existing push subscription state,
 * and exposes subscribe/unsubscribe functions backed by Convex mutations.
 *
 * Graceful no-ops:
 * - If the browser doesn't support Push API → isSupported: false
 * - If NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured → isSupported: false
 * - If userId is null → subscribe/unsubscribe are no-ops
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// ---------------------------------------------------------------------------
// Helper: base64url → Uint8Array (required by pushManager.subscribe)
// ---------------------------------------------------------------------------

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const output = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
        output[i] = rawData.charCodeAt(i);
    }
    return output;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface PushSubscriptionState {
    isSupported: boolean;
    isSubscribed: boolean;
    subscribe: () => Promise<void>;
    unsubscribe: () => Promise<void>;
}

/**
 * Manages Web Push subscription for the current user.
 *
 * @param userId - Clerk user ID or guest session ID. Pass null if user is not
 *   yet identified — subscribe/unsubscribe will be no-ops.
 */
export function usePushSubscription(userId: string | null): PushSubscriptionState {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Stable refs for the service worker registration and active subscription
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const subscriptionRef = useRef<PushSubscription | null>(null);

    const savePushSubscription = useMutation(api.pushSubscriptions.savePushSubscription);
    const deletePushSubscription = useMutation(api.pushSubscriptions.deletePushSubscription);

    // On mount: check browser support, register SW, check existing subscription
    useEffect(() => {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !vapidPublicKey) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);

        let cancelled = false;

        async function init() {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none',
                });

                if (cancelled) return;
                registrationRef.current = registration;

                const existingSubscription = await registration.pushManager.getSubscription();

                if (cancelled) return;

                if (existingSubscription) {
                    subscriptionRef.current = existingSubscription;
                    setIsSubscribed(true);
                }
            } catch (err) {
                console.error('[push] Service worker registration failed', err);
            }
        }

        void init();

        return () => {
            cancelled = true;
        };
    }, []);

    const subscribe = useCallback(async (): Promise<void> => {
        if (!userId) {
            console.warn('[push] Cannot subscribe: userId is null');
            return;
        }

        const registration = registrationRef.current;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!registration || !vapidPublicKey) {
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            subscriptionRef.current = subscription;

            const json = subscription.toJSON();
            const p256dh = json.keys?.p256dh ?? '';
            const auth = json.keys?.auth ?? '';

            await savePushSubscription({
                userId,
                endpoint: subscription.endpoint,
                keys: { p256dh, auth },
            });

            setIsSubscribed(true);
        } catch (err) {
            console.error('[push] Subscription failed', err);
        }
    }, [userId, savePushSubscription]);

    const unsubscribe = useCallback(async (): Promise<void> => {
        if (!userId) {
            return;
        }

        const subscription = subscriptionRef.current;
        if (!subscription) {
            return;
        }

        try {
            await subscription.unsubscribe();

            await deletePushSubscription({
                userId,
                endpoint: subscription.endpoint,
            });

            subscriptionRef.current = null;
            setIsSubscribed(false);
        } catch (err) {
            console.error('[push] Unsubscription failed', err);
        }
    }, [userId, deletePushSubscription]);

    return { isSupported, isSubscribed, subscribe, unsubscribe };
}
