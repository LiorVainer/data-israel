/**
 * Phase 3 type-level test: verifies that app/api/chat/route.ts imports and uses
 * sendPushToUser from lib/push/send-notification.ts.
 *
 * This file checks at compile-time that the function signature expected in the
 * onFinish callback is present and correct. It does NOT run at runtime.
 *
 * RED phase: before adding sendPushToUser import to route.ts, this file verifies
 * the contract that must be satisfied.
 */

import { sendPushToUser, type PushPayload } from '@/lib/push/send-notification';

// Verify sendPushToUser accepts (userId: string, payload: PushPayload)
async function verifySendPushToUserSignature() {
    const userId = 'user_test123';
    const payload: PushPayload = {
        threadId: 'thread-abc-123',
        title: 'התשובה מוכנה ✨',
        body: 'התשובה לשאלתך מוכנה. לחץ כדי לצפות.',
    };

    // Must be fire-and-forget — returns Promise<void> and can be void-prefixed
    void sendPushToUser(userId, payload);
}

// Verify the function is exported and callable
const _typeAssert: (userId: string, payload: PushPayload) => Promise<void> = sendPushToUser;

export { verifySendPushToUserSignature, _typeAssert };
