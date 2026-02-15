/**
 * Convex Client
 *
 * Provides Convex client for use in Next.js app
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { ENV } from '@/lib/env';

// Convex deployment URL
const CONVEX_URL = ENV.NEXT_PUBLIC_CONVEX_URL ?? 'https://decisive-alpaca-889.convex.cloud';

/**
 * HTTP client for server-side Convex queries
 * Used in API routes and server components
 */
export const convexClient = new ConvexHttpClient(CONVEX_URL);

/**
 * Re-export API for type safety
 */
export { api };

/**
 * Helper to run Convex queries
 */
export async function convexQuery<T>(
    queryFn: Parameters<typeof convexClient.query>[0],
    args: Parameters<typeof convexClient.query>[1],
): Promise<T> {
    return convexClient.query(queryFn, args) as Promise<T>;
}

/**
 * Helper to run Convex mutations
 */
export async function convexMutation<T>(
    mutationFn: Parameters<typeof convexClient.mutation>[0],
    args: Parameters<typeof convexClient.mutation>[1],
): Promise<T> {
    return convexClient.mutation(mutationFn, args) as Promise<T>;
}

/**
 * Helper to run Convex actions
 */
export async function convexAction<T>(
    actionFn: Parameters<typeof convexClient.action>[0],
    args: Parameters<typeof convexClient.action>[1],
): Promise<T> {
    return convexClient.action(actionFn, args) as Promise<T>;
}
