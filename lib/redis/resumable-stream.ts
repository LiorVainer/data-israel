/**
 * Resumable Stream Infrastructure
 *
 * Two responsibilities:
 *
 * A) Resumable Stream Context Factory
 *    - Uses `resumable-stream` package which internally manages Redis pub/sub
 *      connections via the REDIS_URL environment variable.
 *    - Exports `getResumableStreamContext()` for creating resumable stream contexts.
 *
 * B) ActiveStreamId Helpers
 *    - Uses the Upstash HTTP-based Redis client from `./client.ts`
 *    - Manages the mapping of threadId -> active streamId with a 10-minute TTL.
 *    - Key pattern: `stream:active:{threadId}`
 */

import { createResumableStreamContext, type ResumableStreamContext } from 'resumable-stream';

import { getRedisClient } from './client';

/** TTL for active stream IDs in seconds (10 minutes). */
const ACTIVE_STREAM_TTL_SECONDS = 600;

/** Key prefix for active stream ID entries. */
const ACTIVE_STREAM_KEY_PREFIX = 'stream:active';

// ---------------------------------------------------------------------------
// A) Resumable Stream Context Factory
// ---------------------------------------------------------------------------

/**
 * Creates a `ResumableStreamContext` for use in streaming API routes.
 *
 * The `resumable-stream` package internally creates Redis pub/sub connections
 * using the `REDIS_URL` (or `KV_URL`) environment variable. If that variable
 * is not set, `createResumableStreamContext` will throw, so we catch and
 * return `null` to allow graceful degradation.
 *
 * @param waitUntil - Vercel / Next.js `waitUntil` callback, or `null` for
 *   long-lived server environments.
 */
export function getResumableStreamContext(
    waitUntil: ((promise: Promise<unknown>) => void) | null,
): ResumableStreamContext | null {
    try {
        return createResumableStreamContext({ waitUntil });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[redis/resumable-stream] Could not create resumable stream context: ${message}`);
        return null;
    }
}

// ---------------------------------------------------------------------------
// B) ActiveStreamId Helpers (Upstash REST client)
// ---------------------------------------------------------------------------

/**
 * Builds the Redis key for a given thread's active stream ID.
 */
function activeStreamKey(threadId: string): string {
    return `${ACTIVE_STREAM_KEY_PREFIX}:${threadId}`;
}

/**
 * Stores the active stream ID for a thread with a 10-minute TTL.
 *
 * No-op if the Redis client is unavailable.
 */
export async function setActiveStreamId(threadId: string, streamId: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        await redis.set(activeStreamKey(threadId), streamId, {
            ex: ACTIVE_STREAM_TTL_SECONDS,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[redis/resumable-stream] Failed to set active stream ID for thread ${threadId}: ${message}`);
    }
}

/**
 * Retrieves the active stream ID for a thread.
 *
 * Returns `null` if the Redis client is unavailable, if no active stream
 * exists, or if the TTL has expired.
 */
export async function getActiveStreamId(threadId: string): Promise<string | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
        const value = await redis.get<string>(activeStreamKey(threadId));
        return value ?? null;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[redis/resumable-stream] Failed to get active stream ID for thread ${threadId}: ${message}`);
        return null;
    }
}

/**
 * Removes the active stream ID for a thread.
 *
 * No-op if the Redis client is unavailable.
 */
export async function clearActiveStreamId(threadId: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        await redis.del(activeStreamKey(threadId));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[redis/resumable-stream] Failed to clear active stream ID for thread ${threadId}: ${message}`);
    }
}
