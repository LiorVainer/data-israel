/**
 * Mastra Convex Storage Handler (patched)
 *
 * Overrides the default @mastra/convex storage handler to fix the 16MB/32K document
 * read limit error. The upstream `queryTable` operation does a full table scan
 * (.take(10000)) then filters in JS — which hits Convex limits once enough messages
 * accumulate across all threads.
 *
 * This patch intercepts `queryTable` on `mastra_messages` to use the `by_thread_created`
 * index when filtering by `thread_id`, avoiding the full table scan.
 */

import { mutationGeneric } from 'convex/server';
import type { GenericMutationCtx as MutationCtx } from 'convex/server';
import { mastraStorage } from '@mastra/convex/server';
import type { DataModel } from '../_generated/dataModel';
import { api } from '../_generated/api';

interface StorageFilter {
    field: string;
    value: unknown;
}

interface StorageRequest {
    tableName: string;
    op: string;
    filters?: StorageFilter[];
    limit?: number;
    indexHint?: { index: string; workflowName?: string; runId?: string };
    [key: string]: unknown;
}

interface StorageResponse {
    ok: boolean;
    result?: unknown;
    error?: string;
    hasMore?: boolean;
}

/**
 * Patched queryTable for mastra_messages: uses `by_thread_created` index
 * instead of full table scan when filtering by thread_id.
 */
async function patchedMessagesQuery(
    ctx: MutationCtx<DataModel>,
    request: StorageRequest,
): Promise<StorageResponse> {
    const threadFilter = request.filters?.find((f) => f.field === 'thread_id');

    if (!threadFilter) {
        // No thread_id filter — fall through to upstream via _upstream
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ctx.runMutation(api.mastra.storage._upstream, request as any) as Promise<StorageResponse>;
    }

    const threadId = threadFilter.value as string;
    const limit = request.limit ?? 10000;

    // Use the by_thread_created index for efficient, ordered retrieval
    let docs = await ctx.db
        .query('mastra_messages')
        .withIndex('by_thread_created', (q) => q.eq('thread_id', threadId))
        .take(limit);

    // Apply remaining filters (e.g. resourceId) in JS
    const otherFilters = request.filters?.filter((f) => f.field !== 'thread_id');
    if (otherFilters && otherFilters.length > 0) {
        docs = docs.filter((doc) =>
            otherFilters.every((filter) => (doc as Record<string, unknown>)[filter.field] === filter.value),
        );
    }

    if (request.limit) {
        docs = docs.slice(0, request.limit);
    }

    return { ok: true, result: docs };
}

/** Re-export the original handler so we can delegate to it via ctx.runMutation */
export const _upstream = mastraStorage;

/** Patched handler — intercepts messages queryTable, delegates everything else */
export const handle = mutationGeneric(
    async (ctx: MutationCtx<DataModel>, request: StorageRequest): Promise<StorageResponse> => {
        // Intercept queryTable on mastra_messages to use indexed query
        if (request.tableName === 'mastra_messages' && request.op === 'queryTable') {
            return patchedMessagesQuery(ctx, request);
        }

        // All other operations: delegate to the upstream handler
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ctx.runMutation(api.mastra.storage._upstream, request as any) as Promise<StorageResponse>;
    },
);
