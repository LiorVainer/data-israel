/**
 * Upstash Redis Client (HTTP-based)
 *
 * Provides a singleton Redis client using @upstash/redis for HTTP-based
 * Redis operations (activeStreamId management). This is separate from
 * the standard Redis protocol connection used by resumable-stream for pub/sub.
 *
 * Environment variables:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST API URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST API token
 */

import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;
let missingEnvWarned = false;

/**
 * Returns the singleton Upstash Redis client instance.
 *
 * Returns `null` if the required environment variables are not set,
 * logging a warning once on the first call.
 */
export function getRedisClient(): Redis | null {
    if (redisInstance) {
        return redisInstance;
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        if (!missingEnvWarned) {
            console.warn(
                '[redis/client] UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN not set. ' +
                    'Redis client is disabled; resumable streaming features will be unavailable.',
            );
            missingEnvWarned = true;
        }
        return null;
    }

    redisInstance = new Redis({ url, token });
    return redisInstance;
}
