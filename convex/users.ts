/**
 * User Convex Functions
 *
 * Uses cRPC procedure builders with Zod validation for auth-aware operations.
 * Internal mutations (Clerk webhook handlers) remain as vanilla internalMutation.
 */

import { z } from 'zod';
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { authMutation, optionalAuthQuery } from './lib/crpc';

/**
 * Upsert a user from Clerk webhook data.
 * If user exists, updates their profile fields (preserving themePreference).
 * If not, creates a new user record.
 * Kept as vanilla internalMutation - called by Clerk webhook HTTP handler.
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
 * Kept as vanilla internalMutation - called by Clerk webhook HTTP handler.
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
 * Uses optionalAuthQuery middleware - ctx.identity is nullable.
 * Returns null if not authenticated or user not found in database.
 */
export const getCurrentUser = optionalAuthQuery
    .query(async ({ ctx }) => {
        if (!ctx.identity) {
            return null;
        }

        const user = await ctx.db
            .query('users')
            .withIndex('by_clerk_id', (q) => q.eq('clerkId', ctx.clerkUserId!))
            .first();

        return user;
    });

/**
 * Update the current user's theme preference.
 * Uses authMutation middleware - ctx.clerkUserId is guaranteed non-null.
 */
export const updateThemePreference = authMutation
    .input(z.object({ themePreference: z.union([z.literal('light'), z.literal('dark')]) }))
    .mutation(async ({ ctx, input }) => {
        const user = await ctx.db
            .query('users')
            .withIndex('by_clerk_id', (q) => q.eq('clerkId', ctx.clerkUserId))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                themePreference: input.themePreference,
                updatedAt: Date.now(),
            });
        }
    });
