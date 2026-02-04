/**
 * Convex queries for real-time thread management.
 *
 * These thin queries provide real-time reactivity for the UI sidebar.
 * All thread CRUD operations are handled by Mastra's ConvexStore.
 */

import { query } from './_generated/server';
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
export const listUserThreads = query({
    args: { resourceId: v.string() },
    handler: async (ctx, { resourceId }) => {
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
