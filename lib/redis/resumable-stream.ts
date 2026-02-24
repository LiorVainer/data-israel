/**
 * Resumable Stream Infrastructure
 *
 * Two responsibilities:
 *
 * A) Resumable Stream Context Factory
 *    - Uses `resumable-stream` package with our own properly-configured Redis clients
 *    - The `redis` npm TCP clients are created with error handlers and reconnect
 *      strategy to prevent uncaught "Socket closed unexpectedly" crashes with Upstash
 *    - Clients are connected eagerly and cached as module-level singletons
 *      (the `resumable-stream` package skips `.connect()` on externally-provided clients)
 *    - Exports `getResumableStreamContext()` for creating resumable stream contexts.
 *
 * B) ActiveStreamId Helpers
 *    - Uses the Upstash HTTP-based Redis client from `./client.ts`
 *    - Manages the mapping of threadId -> active streamId with a 10-minute TTL.
 *    - Key pattern: `stream:active:{threadId}`
 */

import { createClient, type RedisClientType } from 'redis';
import { createResumableStreamContext, type ResumableStreamContext } from 'resumable-stream';

import { getRedisClient } from './client';

/** TTL for active stream IDs in seconds (10 minutes). */
const ACTIVE_STREAM_TTL_SECONDS = 600;

/**
 * TTL for resumable stream Redis records in seconds (10 minutes).
 * The `resumable-stream` package hardcodes 24h internally; we override
 * by wrapping the publisher's `set` method to cap the EX value.
 */
const RESUMABLE_STREAM_TTL_SECONDS = 600;

/** Key prefix for active stream ID entries. */
const ACTIVE_STREAM_KEY_PREFIX = 'stream:active';

// ---------------------------------------------------------------------------
// A) Resumable Stream Context Factory
// ---------------------------------------------------------------------------

/**
 * Creates a Redis client from REDIS_URL with proper error handling.
 * Attaches an 'error' event handler to prevent uncaught exceptions
 * when Upstash closes idle TCP connections.
 */
function createManagedRedisClient(): RedisClientType | null {
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (!redisUrl) {
        return null;
    }

    const client = createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries: number) => {
                if (retries > 5) {
                    console.error('[redis/resumable-stream] Max reconnection attempts reached');
                    return new Error('Max reconnection attempts reached');
                }
                return Math.min(retries * 200, 2000);
            },
        },
    }) as RedisClientType;

    client.on('error', (err: Error) => {
        console.warn('[redis/resumable-stream] Redis client error (handled):', err.message);
    });

    return client;
}

// Module-level singleton for pre-connected Redis TCP clients.
// The `resumable-stream` package does NOT call `.connect()` on externally-provided
// clients, so we must connect them ourselves and reuse across requests.
let publisherClient: RedisClientType | null = null;
let subscriberClient: RedisClientType | null = null;
let connectPromise: Promise<void> | null = null;
let connectionFailed = false;

/**
 * Lazily creates and connects Redis pub/sub clients (singleton).
 * Returns the connected pair, or `null` if REDIS_URL is missing or
 * the connection permanently failed.
 */
async function ensureConnectedClients(): Promise<{
    publisher: RedisClientType;
    subscriber: RedisClientType;
} | null> {
    if (connectionFailed) return null;
    if (publisherClient && subscriberClient) {
        return { publisher: publisherClient, subscriber: subscriberClient };
    }

    if (!connectPromise) {
        connectPromise = (async () => {
            const pub = createManagedRedisClient();
            const sub = createManagedRedisClient();
            if (!pub || !sub) {
                console.warn('[redis/resumable-stream] REDIS_URL/KV_URL not set, resumable streams disabled');
                connectionFailed = true;
                return;
            }
            await Promise.all([pub.connect(), sub.connect()]);
            publisherClient = pub;
            subscriberClient = sub;
        })().catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            console.error('[redis/resumable-stream] Failed to connect Redis clients:', message);
            connectionFailed = true;
            publisherClient = null;
            subscriberClient = null;
        });
    }

    await connectPromise;

    if (!publisherClient || !subscriberClient) return null;
    return { publisher: publisherClient, subscriber: subscriberClient };
}

/**
 * Wraps a Redis publisher to cap the EX (expiry) value on `set` calls.
 *
 * The `resumable-stream` package hardcodes `EX: 24 * 60 * 60` (24 hours)
 * for its sentinel keys. This proxy intercepts `set` calls and replaces
 * the EX value with `RESUMABLE_STREAM_TTL_SECONDS` so stream records
 * expire after 10 minutes instead.
 */
function wrapPublisherWithTtl(publisher: RedisClientType): RedisClientType {
    return new Proxy(publisher, {
        get(target, prop, receiver) {
            if (prop === 'set') {
                return (key: string, value: string, options?: { EX?: number }) => {
                    const patched = options?.EX
                        ? { ...options, EX: RESUMABLE_STREAM_TTL_SECONDS }
                        : options;
                    return target.set(key, value, patched);
                };
            }
            return Reflect.get(target, prop, receiver);
        },
    });
}

/**
 * Creates a `ResumableStreamContext` for use in streaming API routes.
 *
 * Uses pre-connected singleton Redis clients with error handlers and reconnect
 * strategy. A fresh context is created per request so each gets its own
 * `waitUntil`, but the underlying TCP connections are reused.
 *
 * The publisher is wrapped with a Proxy that overrides the hardcoded 24h TTL
 * in the `resumable-stream` package to `RESUMABLE_STREAM_TTL_SECONDS` (10 min).
 *
 * @param waitUntil - Vercel / Next.js `waitUntil` callback, or `null` for
 *   long-lived server environments.
 */
export async function getResumableStreamContext(
    waitUntil: ((promise: Promise<unknown>) => void) | null,
): Promise<ResumableStreamContext | null> {
    try {
        const clients = await ensureConnectedClients();
        if (!clients) return null;

        return createResumableStreamContext({
            waitUntil,
            publisher: wrapPublisherWithTtl(clients.publisher),
            subscriber: clients.subscriber,
        });
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
