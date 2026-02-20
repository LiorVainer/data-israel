import { QueryClient, QueryCache } from '@tanstack/react-query';
import { isCRPCClientError, isCRPCError } from 'better-convex/crpc';
import { toast } from 'sonner';

/**
 * Creates a QueryClient with cRPC-aware error handling and retry logic.
 *
 * - Query errors: logs cRPC client errors with function name
 * - Mutation errors: displays toast notification with error message
 * - Retry: skips retry for cRPC validation/auth errors, retries timeouts up to 3 times
 * - Stale time: Infinity because Convex handles freshness via WebSocket subscriptions
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: (error) => {
                if (isCRPCClientError(error)) {
                    console.warn(`[CRPC] ${error.code}:`, error.functionName);
                }
            },
        }),
        defaultOptions: {
            mutations: {
                onError: (err) => {
                    const message =
                        err instanceof Error ? err.message : String(err);
                    toast.error(message);
                },
            },
            queries: {
                staleTime: Infinity, // Convex handles freshness via WebSocket
                retry: (failureCount, error) => {
                    if (isCRPCError(error)) return false; // Don't retry auth/validation errors
                    const message =
                        error instanceof Error ? error.message : String(error);
                    if (message.includes('timed out') && failureCount < 3)
                        return true;
                    return failureCount < 3;
                },
                retryDelay: (attemptIndex) =>
                    Math.min(2000 * 2 ** attemptIndex, 30_000),
            },
        },
    });
}
