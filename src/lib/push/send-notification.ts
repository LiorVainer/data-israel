/**
 * Server-side Web Push notification sender.
 *
 * Configures `web-push` with VAPID credentials and exports `sendPushToUser`,
 * which fans out a notification payload to every push subscription stored for
 * a given user. This is fire-and-forget — all errors are caught and logged;
 * none are re-thrown.
 *
 * Graceful no-op: if VAPID environment variables are absent the function
 * returns immediately without throwing, so missing keys never break the chat
 * response stream.
 *
 * Stale subscription cleanup: when `web-push` receives an HTTP 410 Gone
 * response the browser has permanently invalidated the subscription. We call
 * `deleteByEndpoint` to remove it from Convex so future fan-outs skip it.
 */

import webpush from 'web-push';
import type { PushSubscription } from 'web-push';
import { convexClient } from '@/lib/convex/client';
import { api } from '@/convex/_generated/api';

// ---------------------------------------------------------------------------
// VAPID configuration
// ---------------------------------------------------------------------------

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
    if (vapidConfigured) return true;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
        return false;
    }

    webpush.setVapidDetails('mailto:noreply@data-israel.org', publicKey, privateKey);
    vapidConfigured = true;
    return true;
}

// ---------------------------------------------------------------------------
// Push payload
// ---------------------------------------------------------------------------

export interface PushPayload {
    threadId: string;
    title: string;
    body: string;
}

// ---------------------------------------------------------------------------
// sendPushToUser — fire-and-forget fan-out
// ---------------------------------------------------------------------------

/**
 * Sends a push notification to all subscriptions registered for `userId`.
 *
 * - Returns immediately if VAPID keys are not configured.
 * - Fans out to every subscription for the user in parallel.
 * - Catches HTTP 410 Gone responses and removes stale subscriptions from Convex.
 * - All other errors are logged and swallowed — never thrown.
 *
 * @param userId  - Clerk user ID or guest session ID
 * @param payload - Notification content (threadId, title, body)
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!ensureVapidConfigured()) {
        // VAPID keys not configured — silent no-op
        return;
    }

    let subscriptions;

    try {
        subscriptions = await convexClient.query(api.pushSubscriptions.getPushSubscriptionsByUser, { userId });
    } catch (err) {
        console.error('[push] Failed to fetch subscriptions for user', userId, err);
        return;
    }

    if (!subscriptions.length) {
        return;
    }

    const notificationPayload = JSON.stringify(payload);

    await Promise.all(
        subscriptions.map(async (sub) => {
            const pushSubscription: PushSubscription = {
                endpoint: sub.endpoint,
                keys: sub.keys,
            };

            try {
                await webpush.sendNotification(pushSubscription, notificationPayload);
            } catch (err) {
                const isGone =
                    err instanceof Error &&
                    'statusCode' in err &&
                    (err as { statusCode: number }).statusCode === 410;

                if (isGone) {
                    // Browser permanently invalidated this subscription — clean it up
                    try {
                        await convexClient.mutation(api.pushSubscriptions.deleteByEndpoint, {
                            endpoint: sub.endpoint,
                        });
                    } catch (deleteErr) {
                        console.error(
                            '[push] Failed to delete stale subscription',
                            sub.endpoint,
                            deleteErr,
                        );
                    }
                } else {
                    console.error('[push] sendNotification failed for endpoint', sub.endpoint, err);
                }
            }
        }),
    );
}
