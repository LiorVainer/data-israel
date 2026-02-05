/**
 * Convex queries for real-time thread management.
 *
 * These thin queries provide real-time reactivity for the UI sidebar.
 * All thread CRUD operations are handled by Mastra's ConvexStore.
 */

import { query } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

/**
 * Thread data returned by listUserThreads query.
 */
export interface ThreadListItem {
    _id: string;
    id: string;
    title: string;
    metadata: Record<string, unknown> | null;
    _creationTime: number;
}

/**
 * Lists all threads for a given user/resource.
 *
 * This query reads directly from the mastra_threads table and provides
 * real-time reactivity for the sidebar thread list.
 *
 * @param resourceId - The user/resource identifier to filter threads by
 * @returns Array of threads ordered by creation time (newest first)
 */
/**
 * Resolves the authenticated user's canonical resource identifier.
 *
 * Uses Convex auth (Clerk JWT) to get the user's identity subject.
 * Called from Server Components via fetchQuery with a Clerk token.
 *
 * @returns The Clerk user subject string, or null if unauthenticated
 */
export const getAuthResourceId = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        console.log({ identity });
        return identity?.subject ?? null;
    },
});

export const listUserThreads = query({
    args: {
        guestId: v.optional(v.id('guests')),
    },
    handler: async (ctx, { guestId }) => {
        const identity = await ctx.auth.getUserIdentity();

        // Must have either authenticated user or guestId
        if (!identity && !guestId) {
            throw new Error('Not authenticated and no guest ID provided');
        }

        const resourceId = identity?.subject || guestId;

        // Query threads using the by_resource index for efficient filtering
        const threads = await ctx.db
            .query('mastra_threads')
            .withIndex('by_resource', (q) => q.eq('resourceId', resourceId))
            .order('desc')
            .collect();

        // Map to consistent response shape with relevant fields
        return threads.map((thread) => ({
            _id: thread._id,
            id: thread.id,
            title: thread.title,
            metadata: thread.metadata,
            _creationTime: thread._creationTime,
        }));
    },
});

/**
 * Paginated version of listUserThreads for infinite scroll in the sidebar.
 *
 * Uses Convex cursor-based pagination for efficient loading of large thread lists.
 *
 * @param guestId - Optional guest identifier for unauthenticated users
 * @param paginationOpts - Pagination options (numItems, cursor)
 * @returns Paginated result with page of threads, isDone flag, and continueCursor
 */
export const listUserThreadsPaginated = query({
    args: {
        guestId: v.optional(v.id('guests')),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { guestId, paginationOpts }) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity && !guestId) {
            return { page: [], isDone: true, continueCursor: '' };
        }

        const resourceId = identity?.subject || guestId;

        return await ctx.db
            .query('mastra_threads')
            .withIndex('by_resource', (q) => q.eq('resourceId', resourceId))
            .order('desc')
            .paginate(paginationOpts);
    },
});
