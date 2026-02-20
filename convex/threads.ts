/**
 * Convex queries for real-time thread management.
 *
 * These thin queries provide real-time reactivity for the UI sidebar.
 * All thread CRUD operations are handled by Mastra's ConvexStore.
 * Uses cRPC procedure builders with Zod validation and middleware-based auth.
 */

import { z } from 'zod';
import {
    guestAwareMutation,
    guestAwareQuery,
    optionalAuthQuery,
    publicMutation,
    publicQuery,
} from './lib/crpc';

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
 * Resolves the authenticated user's canonical resource identifier.
 *
 * Uses optionalAuthQuery middleware - ctx.identity is nullable.
 * Called from Server Components via fetchQuery with a Clerk token.
 *
 * @returns The Clerk user subject string, or null if unauthenticated
 */
export const getAuthResourceId = optionalAuthQuery
    .query(async ({ ctx }) => {
        return ctx.identity?.subject ?? null;
    });

/**
 * Lists all threads for a given user/resource.
 *
 * Uses guestAwareQuery middleware which resolves ctx.resourceId
 * from either Clerk identity.subject or input.guestId.
 *
 * @returns Array of threads ordered by creation time (newest first)
 */
export const listUserThreads = guestAwareQuery
    .input(z.object({ guestId: z.string().optional() }))
    .query(async ({ ctx }) => {
        // ctx.resourceId is resolved by guestAwareMiddleware
        const threads = await ctx.db
            .query('mastra_threads')
            .withIndex('by_resource', (q) => q.eq('resourceId', ctx.resourceId))
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
    });

/**
 * Paginated version of listUserThreads for infinite scroll in the sidebar.
 *
 * Uses guestAwareQuery middleware with Zod-validated pagination options.
 *
 * @returns Paginated result with page of threads, isDone flag, and continueCursor
 */
export const listUserThreadsPaginated = guestAwareQuery
    .input(
        z.object({
            guestId: z.string().optional(),
            paginationOpts: z.object({
                numItems: z.number(),
                cursor: z.union([z.string(), z.null()]),
            }),
        }),
    )
    .query(async ({ ctx, input }) => {
        return await ctx.db
            .query('mastra_threads')
            .withIndex('by_resource', (q) => q.eq('resourceId', ctx.resourceId))
            .order('desc')
            .paginate(input.paginationOpts);
    });

/**
 * Deletes a thread and all its associated messages.
 *
 * Uses guestAwareMutation middleware which resolves ctx.resourceId.
 * Performs authorization check to ensure the caller owns the thread.
 *
 * @param threadId - The Mastra UUID of the thread (not the Convex _id)
 */
export const deleteThread = guestAwareMutation
    .input(z.object({ threadId: z.string(), guestId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
        // Find thread by its Mastra UUID (not Convex _id)
        const thread = await ctx.db
            .query('mastra_threads')
            .withIndex('by_record_id', (q) => q.eq('id', input.threadId))
            .unique();

        if (!thread) {
            throw new Error('Thread not found');
        }

        // Authorization: verify caller owns this thread
        if (thread.resourceId !== ctx.resourceId) {
            throw new Error('Not authorized to delete this thread');
        }

        // Delete all messages belonging to this thread
        const messages = await ctx.db
            .query('mastra_messages')
            .withIndex('by_thread', (q) => q.eq('thread_id', input.threadId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        // Delete the thread itself
        await ctx.db.delete(thread._id);
    });

/**
 * Renames a thread by updating its title.
 *
 * Uses guestAwareMutation middleware which resolves ctx.resourceId.
 * Performs authorization check to ensure the caller owns the thread.
 *
 * @param threadId - The Mastra UUID of the thread (not the Convex _id)
 * @param newTitle - The new title to set on the thread
 */
export const renameThread = guestAwareMutation
    .input(z.object({ threadId: z.string(), newTitle: z.string(), guestId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
        const thread = await ctx.db
            .query('mastra_threads')
            .withIndex('by_record_id', (q) => q.eq('id', input.threadId))
            .unique();

        if (!thread) {
            throw new Error('Thread not found');
        }

        if (thread.resourceId !== ctx.resourceId) {
            throw new Error('Not authorized to rename this thread');
        }

        await ctx.db.patch(thread._id, {
            title: input.newTitle,
            updatedAt: new Date().toISOString(),
        });
    });

// ---------------------------------------------------------------------------
// Zod schema for usage matching vUsage from @convex-dev/agent
// ---------------------------------------------------------------------------

const zUsage = z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
    reasoningTokens: z.number().optional(),
    cachedInputTokens: z.number().optional(),
});

/**
 * Upserts the context window record for a thread.
 *
 * One record per thread - each turn adds to the running total.
 * Uses publicMutation since this is called from the API route (no auth context).
 */
export const upsertThreadContext = publicMutation
    .input(
        z.object({
            threadId: z.string(),
            userId: z.string(),
            agentName: z.string().optional(),
            model: z.string(),
            provider: z.string(),
            usage: zUsage,
        }),
    )
    .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db
            .query('thread_usage')
            .withIndex('by_thread', (q) => q.eq('threadId', input.threadId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                model: input.model,
                provider: input.provider,
                agentName: input.agentName,
                usage: {
                    promptTokens: (existing.usage.promptTokens ?? 0) + (input.usage.promptTokens ?? 0),
                    completionTokens:
                        (existing.usage.completionTokens ?? 0) + (input.usage.completionTokens ?? 0),
                    totalTokens: (existing.usage.totalTokens ?? 0) + (input.usage.totalTokens ?? 0),
                    reasoningTokens:
                        (existing.usage.reasoningTokens ?? 0) + (input.usage.reasoningTokens ?? 0) || undefined,
                    cachedInputTokens:
                        (existing.usage.cachedInputTokens ?? 0) + (input.usage.cachedInputTokens ?? 0) ||
                        undefined,
                },
                createdAt: Date.now(),
            });
            return existing._id;
        }

        return ctx.db.insert('thread_usage', {
            ...input,
            createdAt: Date.now(),
        });
    });

/**
 * Returns the context window snapshot for a thread.
 *
 * Single record per thread representing the current context window size.
 * Used by the ContextWindowIndicator to display usage relative to the model's limit.
 */
export const getThreadContextWindow = publicQuery
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
        const record = await ctx.db
            .query('thread_usage')
            .withIndex('by_thread', (q) => q.eq('threadId', input.threadId))
            .first();

        if (!record) {
            return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        }

        return {
            promptTokens: record.usage.promptTokens ?? 0,
            completionTokens: record.usage.completionTokens ?? 0,
            totalTokens: record.usage.totalTokens ?? 0,
        };
    });

/**
 * Upserts accumulated token billing for a thread.
 *
 * One record per thread - each turn adds to the running total.
 * Tracks the real API cost (sum of all steps across all turns).
 * Uses publicMutation since this is called from the API route (no auth context).
 */
export const upsertThreadBilling = publicMutation
    .input(
        z.object({
            threadId: z.string(),
            userId: z.string(),
            agentName: z.string().optional(),
            model: z.string(),
            provider: z.string(),
            usage: zUsage,
        }),
    )
    .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db
            .query('thread_billing')
            .withIndex('by_thread', (q) => q.eq('threadId', input.threadId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                model: input.model,
                provider: input.provider,
                agentName: input.agentName,
                usage: {
                    promptTokens: (existing.usage.promptTokens ?? 0) + (input.usage.promptTokens ?? 0),
                    completionTokens:
                        (existing.usage.completionTokens ?? 0) + (input.usage.completionTokens ?? 0),
                    totalTokens: (existing.usage.totalTokens ?? 0) + (input.usage.totalTokens ?? 0),
                    reasoningTokens:
                        (existing.usage.reasoningTokens ?? 0) + (input.usage.reasoningTokens ?? 0) || undefined,
                    cachedInputTokens:
                        (existing.usage.cachedInputTokens ?? 0) + (input.usage.cachedInputTokens ?? 0) ||
                        undefined,
                },
                createdAt: Date.now(),
            });
            return existing._id;
        }

        return ctx.db.insert('thread_billing', {
            ...input,
            createdAt: Date.now(),
        });
    });
