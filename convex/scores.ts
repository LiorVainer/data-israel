/**
 * Scores — query functions for the mastra_scorers table
 *
 * Provides filtered queries for low-scoring evaluation results,
 * used by the prompt optimizer to identify areas for improvement.
 */

import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Query low-scoring results from mastra_scorers by entity (agent) ID.
 * Uses the `by_entity` index on [entityId, entityType, _creationTime].
 * Filters by max score threshold and optional time range.
 */
export const getLowScores = query({
    args: {
        entityId: v.string(),
        maxScore: v.number(),
        since: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        const results = await ctx.db
            .query('mastra_scorers')
            .withIndex('by_entity', (q) => q.eq('entityId', args.entityId))
            .order('desc')
            .collect();

        return results
            .filter((row) => {
                if (row.score >= args.maxScore) return false;
                // Use Convex's built-in _creationTime (ms since epoch)
                // because mastra's createdAt is an ISO string, not a number
                if (args.since && row._creationTime < args.since) return false;
                return true;
            })
            .slice(0, limit);
    },
});
