import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Upsert a user from Clerk webhook data.
 * If user exists, updates their profile fields (preserving themePreference).
 * If not, creates a new user record.
 */
export const upsertFromClerk = internalMutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, { clerkId, email, firstName, lastName, imageUrl }) => {
        const existingUser = await ctx.db
            .query('users')
            .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                email,
                firstName,
                lastName,
                imageUrl,
                updatedAt: Date.now(),
            });
            return existingUser._id;
        }

        const now = Date.now();
        const userId = await ctx.db.insert('users', {
            clerkId,
            email,
            firstName,
            lastName,
            imageUrl,
            createdAt: now,
            updatedAt: now,
        });

        return userId;
    },
});

/**
 * Delete a user by their Clerk ID.
 * Called when a user.deleted webhook event is received.
 */
export const deleteByClerkId = internalMutation({
    args: {
        clerkId: v.string(),
    },
    handler: async (ctx, { clerkId }) => {
        const user = await ctx.db
            .query('users')
            .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
            .first();

        if (user) {
            await ctx.db.delete(user._id);
        }
    },
});

/**
 * Get the current authenticated user.
 * Uses ctx.auth.getUserIdentity() to identify the Clerk user,
 * then looks up the corresponding Convex user record.
 */
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query('users')
            .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
            .first();

        return user;
    },
});

/**
 * Update the current user's theme preference.
 * Requires authentication - throws if not logged in.
 */
export const updateThemePreference = mutation({
    args: {
        themePreference: v.union(v.literal('light'), v.literal('dark')),
    },
    handler: async (ctx, { themePreference }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authenticated');
        }

        const user = await ctx.db
            .query('users')
            .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                themePreference,
                updatedAt: Date.now(),
            });
        }
    },
});
