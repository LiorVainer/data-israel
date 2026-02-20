import { z } from 'zod';
import { publicMutation, publicQuery } from './lib/crpc';

/**
 * Create a new guest record or return existing one for the session.
 * This ensures idempotency - multiple calls with same sessionId return same guest.
 */
export const createNewGuest = publicMutation
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        // Check if guest already exists with this sessionId
        const existingGuest = await ctx.db
            .query('guests')
            .withIndex('by_session_id', (q) => q.eq('sessionId', input.sessionId))
            .first();

        if (existingGuest) {
            return existingGuest._id;
        }

        // Create new guest with timestamp
        return ctx.db.insert('guests', {
            sessionId: input.sessionId,
            createdAt: Date.now(),
        });
    });

/**
 * Query to retrieve a guest by their session ID.
 * Returns null if no guest exists with that session.
 */
export const getGuestBySessionId = publicQuery
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
        const guest = await ctx.db
            .query('guests')
            .withIndex('by_session_id', (q) => q.eq('sessionId', input.sessionId))
            .first();

        return guest;
    });

/**
 * Check if a guest record exists by its ID.
 * Uses normalizeId for safe ID validation without throwing on invalid formats.
 */
export const guestExists = publicQuery
    .input(z.object({ guestId: z.string() }))
    .query(async ({ ctx, input }) => {
        const normalizedId = ctx.db.normalizeId('guests', input.guestId);
        if (!normalizedId) return false;
        const guest = await ctx.db.get(normalizedId);
        return guest !== null;
    });
