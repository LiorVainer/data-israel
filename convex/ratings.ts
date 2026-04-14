import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createAnswer = mutation({
    args: {
        threadId: v.string(),
        messageId: v.string(),
        userId: v.string(),
        userPrompt: v.string(),
        assistantResponse: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('answers')
            .withIndex('by_message_id', (q) => q.eq('messageId', args.messageId))
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert('answers', {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const upsertRating = mutation({
    args: {
        messageId: v.string(),
        userId: v.string(),
        rating: v.union(v.literal('good'), v.literal('bad')),
    },
    handler: async (ctx, { messageId, userId, rating }) => {
        const answer = await ctx.db
            .query('answers')
            .withIndex('by_message_id', (q) => q.eq('messageId', messageId))
            .first();

        if (!answer) {
            throw new Error(`No answer found for messageId: ${messageId}`);
        }

        const existingRating = await ctx.db
            .query('answer_ratings')
            .withIndex('by_answer_user', (q) => q.eq('answerId', answer._id).eq('userId', userId))
            .first();

        if (existingRating) {
            if (existingRating.rating === rating) {
                await ctx.db.delete(existingRating._id);
                return null;
            }
            await ctx.db.patch(existingRating._id, {
                rating,
                updatedAt: Date.now(),
            });
            return existingRating._id;
        }

        const now = Date.now();
        return await ctx.db.insert('answer_ratings', {
            answerId: answer._id,
            userId,
            rating,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const getRatingsForThread = query({
    args: {
        threadId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, { threadId, userId }): Promise<Record<string, 'good' | 'bad'>> => {
        const answers = await ctx.db
            .query('answers')
            .withIndex('by_thread', (q) => q.eq('threadId', threadId))
            .collect();

        const result: Record<string, 'good' | 'bad'> = {};

        for (const answer of answers) {
            const rating = await ctx.db
                .query('answer_ratings')
                .withIndex('by_answer_user', (q) => q.eq('answerId', answer._id).eq('userId', userId))
                .first();

            if (rating) {
                result[answer.messageId] = rating.rating;
            }
        }

        return result;
    },
});
