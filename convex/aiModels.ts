/**
 * AI Models — per-agent model configuration
 *
 * Provides CRUD operations for the ai_models table.
 * Used by the admin panel to override agent models at runtime.
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get all AI model configurations.
 * Returns all per-agent model overrides stored in the ai_models table.
 */
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return ctx.db.query('ai_models').collect();
    },
});

/**
 * Upsert an AI model configuration for a specific agent.
 * Admin-guarded: checks user's role in the Convex users table.
 *
 * If a record exists for the given agentId, it is updated.
 * Otherwise, a new record is created.
 */
export const upsert = mutation({
    args: {
        agentId: v.string(),
        modelId: v.string(),
    },
    handler: async (ctx, { agentId, modelId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Authentication required');
        }

        // Check admin role from Convex users table
        const user = await ctx.db
            .query('users')
            .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
            .first();

        if (!user || user.role !== 'admin') {
            throw new Error('Admin access required');
        }

        const updatedBy = identity.subject;
        const updatedAt = Date.now();

        // Check if a record exists for this agentId
        const existing = await ctx.db
            .query('ai_models')
            .withIndex('by_agent_id', (q) => q.eq('agentId', agentId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { modelId, updatedAt, updatedBy });
            return existing._id;
        }

        return ctx.db.insert('ai_models', { agentId, modelId, updatedAt, updatedBy });
    },
});
