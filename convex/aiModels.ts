/**
 * AI Models — per-agent model configuration
 *
 * Provides CRUD operations for the ai_models table.
 * Used by the admin panel to override agent models at runtime.
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin } from './_shared/auth';

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
        const { updatedBy, updatedAt } = await requireAdmin(ctx);

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

/**
 * Bulk upsert AI model configurations for multiple agents.
 * Admin-guarded: checks user's role in the Convex users table.
 *
 * Updates all specified agents to the same model in a single transaction.
 */
export const bulkUpsert = mutation({
    args: {
        agentIds: v.array(v.string()),
        modelId: v.string(),
    },
    handler: async (ctx, { agentIds, modelId }) => {
        const { updatedBy, updatedAt } = await requireAdmin(ctx);

        for (const agentId of agentIds) {
            const existing = await ctx.db
                .query('ai_models')
                .withIndex('by_agent_id', (q) => q.eq('agentId', agentId))
                .unique();

            if (existing) {
                await ctx.db.patch(existing._id, { modelId, updatedAt, updatedBy });
            } else {
                await ctx.db.insert('ai_models', { agentId, modelId, updatedAt, updatedBy });
            }
        }
    },
});
