/**
 * cRPC procedure builders and middleware for Convex functions.
 *
 * Provides tRPC-style procedure definitions with:
 * - Pattern A: `clerkAuthMiddleware` - Strict Clerk auth, throws UNAUTHORIZED if missing
 * - Pattern B: `optionalClerkAuthMiddleware` - Soft auth, nullable identity
 * - Pattern C: `guestAwareMiddleware` - Resolves resourceId from auth OR guest input
 *
 * All procedures include ORM context via `withOrm`.
 */

import { CRPCError, initCRPC } from 'better-convex/server';
import type { DataModel } from '../_generated/dataModel';
import {
    query,
    mutation,
    action,
    httpAction,
    internalQuery,
    internalMutation,
    internalAction,
} from '../_generated/server';
import { withOrm } from './orm';

// ---------------------------------------------------------------------------
// cRPC instance
// ---------------------------------------------------------------------------

const c = initCRPC
    .dataModel<DataModel>()
    .context({
        query: (ctx) => withOrm(ctx),
        mutation: (ctx) => withOrm(ctx),
    })
    .create({
        query,
        mutation,
        action,
        httpAction,
        internalQuery,
        internalMutation,
        internalAction,
    });

// ---------------------------------------------------------------------------
// Middleware A: Auth Required (Clerk)
// ---------------------------------------------------------------------------

/**
 * Requires a valid Clerk identity. Throws UNAUTHORIZED if none.
 * Adds `ctx.identity` (non-null) and `ctx.clerkUserId` (subject string).
 */
const clerkAuthMiddleware = c.middleware(async ({ ctx, next }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
        throw new CRPCError({
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
        });
    }

    return next({
        ctx: { identity, clerkUserId: identity.subject },
    });
});

// ---------------------------------------------------------------------------
// Middleware B: Auth Optional (Clerk)
// ---------------------------------------------------------------------------

/**
 * Attempts to resolve Clerk identity but does not fail if absent.
 * Adds nullable `ctx.identity` and `ctx.clerkUserId`.
 */
const optionalClerkAuthMiddleware = c.middleware(async ({ ctx, next }) => {
    const identity = await ctx.auth.getUserIdentity();

    return next({
        ctx: {
            identity: identity ?? null,
            clerkUserId: identity?.subject ?? null,
        },
    });
});

// ---------------------------------------------------------------------------
// Middleware C: Guest-Aware (auth OR guest)
// ---------------------------------------------------------------------------

/**
 * Resolves `ctx.resourceId` from either Clerk `identity.subject` or
 * `input.guestId`. Throws UNAUTHORIZED if neither is available.
 */
const guestAwareMiddleware = c.middleware(async ({ ctx, input, next }) => {
    const identity = await ctx.auth.getUserIdentity();
    const guestId = (input as { guestId?: string } | undefined)?.guestId;
    const resourceId = identity?.subject ?? guestId;

    if (!resourceId) {
        throw new CRPCError({
            code: 'UNAUTHORIZED',
            message: 'Not authenticated and no guest ID provided',
        });
    }

    return next({
        ctx: { identity: identity ?? null, resourceId },
    });
});

// ---------------------------------------------------------------------------
// Procedure builders
// ---------------------------------------------------------------------------

/** Public query - no auth required, includes ORM context */
export const publicQuery = c.query;

/** Public mutation - no auth required, includes ORM context */
export const publicMutation = c.mutation;

/** Public action - no auth required */
export const publicAction = c.action;

/** Authenticated query - requires valid Clerk identity */
export const authQuery = c.query.use(clerkAuthMiddleware);

/** Authenticated mutation - requires valid Clerk identity */
export const authMutation = c.mutation.use(clerkAuthMiddleware);

/** Optional auth query - identity is nullable */
export const optionalAuthQuery = c.query.use(optionalClerkAuthMiddleware);

/** Guest-aware query - resolves resourceId from auth or guestId input */
export const guestAwareQuery = c.query.use(guestAwareMiddleware);

/** Guest-aware mutation - resolves resourceId from auth or guestId input */
export const guestAwareMutation = c.mutation.use(guestAwareMiddleware);

/** Internal query - only callable from other Convex functions */
export const privateQuery = c.query.internal();

/** Internal mutation - only callable from other Convex functions */
export const privateMutation = c.mutation.internal();

/** Internal action - only callable from other Convex functions */
export const privateAction = c.action.internal();
