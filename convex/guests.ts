import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Create a new guest record or return existing one for the session.
 * This ensures idempotency - multiple calls with same sessionId return same guest.
 */
export const createNewGuest = mutation({
    args: {
        sessionId: v.string(),
    },
    handler: async (ctx, { sessionId }) => {
        // Check if guest already exists with this sessionId
        const existingGuest = await ctx.db
            .query('guests')
            .withIndex('by_session_id', (q) => q.eq('sessionId', sessionId))
            .first();

        if (existingGuest) {
            return existingGuest._id;
        }

        // Create new guest with timestamp
        const guestId = await ctx.db.insert('guests', {
            sessionId,
            createdAt: Date.now(),
        });

        return guestId;
    },
});

/**
 * Query to retrieve a guest by their session ID.
 * Returns null if no guest exists with that session.
 */
export const getGuestBySessionId = query({
    args: { sessionId: v.string() },
    handler: async (ctx, { sessionId }) => {
        const guest = await ctx.db
            .query('guests')
            .withIndex('by_session_id', (q) => q.eq('sessionId', sessionId))
            .first();

        return guest;
    },
});
