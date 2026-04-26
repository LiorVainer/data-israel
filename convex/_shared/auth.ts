/**
 * Shared auth helpers for Convex mutations.
 *
 * `requireAdmin(ctx)` enforces that the calling user is authenticated
 * AND has `role === 'admin'` in the Convex `users` table.
 *
 * Returns the authenticated identity, the resolved user record, and
 * `updatedBy` / `updatedAt` fields ready to be spread into mutation patches.
 *
 * Throws on unauthenticated or non-admin callers — never returns nullable.
 */

import type { MutationCtx } from '../_generated/server';

export async function requireAdmin(ctx: MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error('Authentication required');
    }

    const user = await ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
        .first();

    if (!user || user.role !== 'admin') {
        throw new Error('Admin access required');
    }

    return {
        identity,
        user,
        updatedBy: identity.subject,
        updatedAt: Date.now(),
    };
}
