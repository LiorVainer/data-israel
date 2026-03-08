/**
 * Phase 4 type-level test: verifies that hooks/use-push-subscription.ts exports
 * the correct interface and that components/chat/NotificationPrompt.tsx exports
 * a valid React component with the required props.
 *
 * This file checks at compile-time that the contracts required by Phase 4 are
 * satisfied. It does NOT run at runtime.
 *
 * RED phase: before creating use-push-subscription.ts and NotificationPrompt.tsx,
 * this file fails to compile — confirming the tests are meaningful.
 */

import type { PushSubscriptionState } from '@/hooks/use-push-subscription';
import { usePushSubscription } from '@/hooks/use-push-subscription';
import { NotificationPrompt } from '@/components/chat/NotificationPrompt';
import type { FC } from 'react';

// --- Hook contract ---

// usePushSubscription accepts (userId: string | null) — verify via typeof assertion
type HookFn = typeof usePushSubscription;

// Validate hook signature: (userId: string | null) => PushSubscriptionState
const _hookSignatureCheck: HookFn = usePushSubscription;

// Validate the return type shape via a type-level assignment
type _AssertReturnShape = ReturnType<HookFn> extends PushSubscriptionState ? true : never;
const _returnShapeIsCorrect: _AssertReturnShape = true;

// Validate that PushSubscriptionState has all required properties
type _AssertIsSupported = PushSubscriptionState['isSupported'] extends boolean ? true : never;
type _AssertIsSubscribed = PushSubscriptionState['isSubscribed'] extends boolean ? true : never;
type _AssertSubscribe = PushSubscriptionState['subscribe'] extends () => Promise<void> ? true : never;
type _AssertUnsubscribe = PushSubscriptionState['unsubscribe'] extends () => Promise<void> ? true : never;

const _isSupportedIsBoolean: _AssertIsSupported = true;
const _isSubscribedIsBoolean: _AssertIsSubscribed = true;
const _subscribeIsAsync: _AssertSubscribe = true;
const _unsubscribeIsAsync: _AssertUnsubscribe = true;

// --- NotificationPrompt contract ---

// NotificationPrompt must be a valid FC with the required props
type NotificationPromptProps = {
    isSupported: boolean;
    isSubscribed: boolean;
    subscribe: () => Promise<void>;
    unsubscribe: () => Promise<void>;
    hasMessages: boolean;
};

// Verify NotificationPrompt is a component accepting the required props
const _typeAssert: FC<NotificationPromptProps> = NotificationPrompt;

export {
    _hookSignatureCheck,
    _returnShapeIsCorrect,
    _isSupportedIsBoolean,
    _isSubscribedIsBoolean,
    _subscribeIsAsync,
    _unsubscribeIsAsync,
    _typeAssert,
};
