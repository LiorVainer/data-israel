/**
 * Convex queries for real-time thread management.
 *
 * These thin queries provide real-time reactivity for the UI sidebar.
 * All thread CRUD operations are handled by Mastra's ConvexStore.
 */

import { mutation, query } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { vUsage, vProviderMetadata } from '@convex-dev/agent';

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

        try {
            return await ctx.db
                .query('mastra_threads')
                .withIndex('by_resource', (q) => q.eq('resourceId', resourceId))
                .order('desc')
                .paginate(paginationOpts);
        } catch (error) {
            // Cursor becomes invalid during auth transitions (e.g., logout changes
            // resourceId while the client still holds a cursor from the old query).
            // Return empty page so the client resets pagination cleanly.
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes('InvalidCursor') || msg.includes('cursor is from a different query')) {
                return { page: [], isDone: true, continueCursor: '' };
            }
            throw error;
        }
    },
});

/**
 * Deletes a thread and all its associated messages.
 *
 * Performs authorization check to ensure the caller owns the thread.
 * Uses the `by_record_id` index on mastra_threads to find the thread by
 * its Mastra UUID, then the `by_thread` index on mastra_messages to
 * collect and delete all related messages before removing the thread itself.
 *
 * @param threadId - The Mastra UUID of the thread (not the Convex _id)
 * @param guestId - Optional guest identifier for unauthenticated users
 */
export const deleteThread = mutation({
    args: {
        threadId: v.string(),
        guestId: v.optional(v.id('guests')),
    },
    handler: async (ctx, { threadId, guestId }) => {
        const identity = await ctx.auth.getUserIdentity();
        const resourceId = identity?.subject ?? guestId;

        if (!resourceId) {
            throw new Error('Not authenticated and no guest ID provided');
        }

        // Find thread by its Mastra UUID (not Convex _id)
        const thread = await ctx.db
            .query('mastra_threads')
            .withIndex('by_record_id', (q) => q.eq('id', threadId))
            .unique();

        if (!thread) {
            throw new Error('Thread not found');
        }

        // Authorization: verify caller owns this thread
        if (thread.resourceId !== resourceId) {
            throw new Error('Not authorized to delete this thread');
        }

        // Delete all messages belonging to this thread
        const messages = await ctx.db
            .query('mastra_messages')
            .withIndex('by_thread', (q) => q.eq('thread_id', threadId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        // Delete the thread itself
        await ctx.db.delete(thread._id);
    },
});

/**
 * Renames a thread by updating its title.
 *
 * Performs authorization check to ensure the caller owns the thread.
 * Uses the `by_record_id` index on mastra_threads to locate the thread,
 * then patches the title and updatedAt timestamp.
 *
 * @param threadId - The Mastra UUID of the thread (not the Convex _id)
 * @param newTitle - The new title to set on the thread
 * @param guestId - Optional guest identifier for unauthenticated users
 */
export const renameThread = mutation({
    args: {
        threadId: v.string(),
        newTitle: v.string(),
        guestId: v.optional(v.id('guests')),
    },
    handler: async (ctx, { threadId, newTitle, guestId }) => {
        const identity = await ctx.auth.getUserIdentity();
        const resourceId = identity?.subject ?? guestId;

        if (!resourceId) {
            throw new Error('Not authenticated and no guest ID provided');
        }

        const thread = await ctx.db
            .query('mastra_threads')
            .withIndex('by_record_id', (q) => q.eq('id', threadId))
            .unique();

        if (!thread) {
            throw new Error('Thread not found');
        }

        if (thread.resourceId !== resourceId) {
            throw new Error('Not authorized to rename this thread');
        }

        await ctx.db.patch(thread._id, {
            title: newTitle,
            updatedAt: new Date().toISOString(),
        });
    },
});

/**
 * Upserts the context window record for a thread.
 *
 * One record per thread — each turn overwrites with the latest snapshot.
 * The API route passes the last step's usage.totalTokens, which represents
 * the full current context window size (not incremental values).
 *
 * @param threadId - The thread UUID
 * @param userId - The user or guest identifier
 * @param model - The model identifier used
 * @param provider - The provider name
 * @param usage - Context window usage snapshot (overwrites existing values)
 */
export const upsertThreadContext = mutation({
    args: {
        threadId: v.string(),
        userId: v.string(),
        agentName: v.optional(v.string()),
        model: v.string(),
        provider: v.string(),
        usage: vUsage,
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('thread_usage')
            .withIndex('by_thread', (q) => q.eq('threadId', args.threadId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                model: args.model,
                provider: args.provider,
                agentName: args.agentName,
                usage: args.usage,
                createdAt: Date.now(),
            });
            return existing._id;
        }

        return ctx.db.insert('thread_usage', {
            ...args,
            createdAt: Date.now(),
        });
    },
});

/**
 * Returns the context window snapshot for a thread.
 *
 * Single record per thread representing the current context window size.
 * Used by the ContextWindowIndicator to display usage relative to the model's limit.
 *
 * @param threadId - The thread UUID to look up
 * @returns Snapshot: promptTokens, completionTokens, totalTokens
 */
export const getThreadContextWindow = query({
    args: { threadId: v.string() },
    handler: async (ctx, { threadId }) => {
        const record = await ctx.db
            .query('thread_usage')
            .withIndex('by_thread', (q) => q.eq('threadId', threadId))
            .first();

        if (!record) {
            return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        }

        return {
            promptTokens: record.usage.promptTokens ?? 0,
            completionTokens: record.usage.completionTokens ?? 0,
            totalTokens: record.usage.totalTokens ?? 0,
        };
    },
});

/**
 * Returns the enabled data sources for a thread.
 *
 * Looks up the thread_settings record by threadId using the `by_thread_id` index.
 * Returns the enabledSources array, or null if no settings are stored (meaning defaults apply).
 *
 * @param threadId - The thread UUID
 * @returns Array of enabled source IDs, or null if no custom settings
 */
export const getThreadSettings = query({
    args: { threadId: v.string() },
    handler: async (ctx, { threadId }) => {
        const record = await ctx.db
            .query('thread_settings')
            .withIndex('by_thread_id', (q) => q.eq('threadId', threadId))
            .unique();

        return record?.enabledSources ?? null;
    },
});

/**
 * Upserts thread-level data source settings.
 *
 * If enabledSources is empty, deletes the record (empty = default = no storage needed).
 * Otherwise, inserts or updates the record with the new enabledSources array.
 *
 * @param threadId - The thread UUID
 * @param enabledSources - Array of enabled data source IDs
 */
export const upsertThreadSettings = mutation({
    args: {
        threadId: v.string(),
        enabledSources: v.array(v.string()),
    },
    handler: async (ctx, { threadId, enabledSources }) => {
        const existing = await ctx.db
            .query('thread_settings')
            .withIndex('by_thread_id', (q) => q.eq('threadId', threadId))
            .unique();

        // Empty array means "use defaults" — no need to store
        if (enabledSources.length === 0) {
            if (existing) {
                await ctx.db.delete(existing._id);
            }
            return;
        }

        if (existing) {
            await ctx.db.patch(existing._id, {
                enabledSources,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert('thread_settings', {
                threadId,
                enabledSources,
                updatedAt: Date.now(),
            });
        }
    },
});

/**
 * Upserts accumulated token billing for a thread.
 *
 * One record per thread — each turn adds to the running total.
 * Tracks the real API cost (sum of all steps across all turns).
 * Not displayed in the UI; used for cost tracking and analytics only.
 *
 * @param threadId - The thread UUID
 * @param userId - The user or guest identifier
 * @param model - The model identifier used
 * @param provider - The provider name
 * @param usage - This turn's accumulated token usage to add to the running total
 */
export const upsertThreadBilling = mutation({
    args: {
        threadId: v.string(),
        userId: v.string(),
        agentName: v.optional(v.string()),
        model: v.string(),
        provider: v.string(),
        usage: vUsage,
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('thread_billing')
            .withIndex('by_thread', (q) => q.eq('threadId', args.threadId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                model: args.model,
                provider: args.provider,
                agentName: args.agentName,
                usage: {
                    promptTokens: (existing.usage.promptTokens ?? 0) + (args.usage.promptTokens ?? 0),
                    completionTokens: (existing.usage.completionTokens ?? 0) + (args.usage.completionTokens ?? 0),
                    totalTokens: (existing.usage.totalTokens ?? 0) + (args.usage.totalTokens ?? 0),
                    reasoningTokens:
                        (existing.usage.reasoningTokens ?? 0) + (args.usage.reasoningTokens ?? 0) || undefined,
                    cachedInputTokens:
                        (existing.usage.cachedInputTokens ?? 0) + (args.usage.cachedInputTokens ?? 0) || undefined,
                },
                createdAt: Date.now(),
            });
            return existing._id;
        }

        return ctx.db.insert('thread_billing', {
            ...args,
            createdAt: Date.now(),
        });
    },
});
