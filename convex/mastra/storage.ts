/**
 * Mastra storage handler for Convex.
 *
 * This is a local copy of the mutation from @mastra/convex/server with the
 * @mastra/core/storage import replaced by inlined constants.  The original
 * import pulls in Node.js APIs (crypto, stream/web) that the Convex V8
 * bundler cannot resolve.
 */

import { mutationGeneric } from 'convex/server';

// Inlined from @mastra/core/storage – these are plain string constants.
const TABLE_THREADS = 'mastra_threads';
const TABLE_MESSAGES = 'mastra_messages';
const TABLE_RESOURCES = 'mastra_resources';
const TABLE_WORKFLOW_SNAPSHOT = 'mastra_workflow_snapshot';
const TABLE_SCORERS = 'mastra_scorers';

const TABLE_VECTOR_INDEXES = 'mastra_vector_indexes';
const VECTOR_TABLE_PREFIX = 'mastra_vector_';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Request = any;

function resolveTable(tableName: string) {
    switch (tableName) {
        case TABLE_THREADS:
            return { convexTable: 'mastra_threads' as const, isTyped: true };
        case TABLE_MESSAGES:
            return { convexTable: 'mastra_messages' as const, isTyped: true };
        case TABLE_RESOURCES:
            return { convexTable: 'mastra_resources' as const, isTyped: true };
        case TABLE_WORKFLOW_SNAPSHOT:
            return {
                convexTable: 'mastra_workflow_snapshots' as const,
                isTyped: true,
            };
        case TABLE_SCORERS:
            return { convexTable: 'mastra_scorers' as const, isTyped: true };
        case TABLE_VECTOR_INDEXES:
            return {
                convexTable: 'mastra_vector_indexes' as const,
                isTyped: true,
            };
        default:
            if (tableName.startsWith(VECTOR_TABLE_PREFIX)) {
                return {
                    convexTable: 'mastra_vectors' as const,
                    isTyped: true,
                };
            }
            return {
                convexTable: 'mastra_documents' as const,
                isTyped: false,
            };
    }
}

async function handleTypedOperation(
    ctx: Ctx,
    convexTable: string,
    request: Request,
) {
    switch (request.op) {
        case 'insert': {
            const record = request.record;
            const id = record.id;
            if (!id) throw new Error('Record is missing an id');
            const existing = await ctx.db
                .query(convexTable)
                .withIndex('by_record_id', (q: Ctx) => q.eq('id', id))
                .unique();
            if (existing) {
                const { id: _, ...updateData } = record;
                await ctx.db.patch(existing._id, updateData);
            } else {
                await ctx.db.insert(convexTable, record);
            }
            return { ok: true };
        }
        case 'batchInsert': {
            for (const record of request.records) {
                const id = record.id;
                if (!id) continue;
                const existing = await ctx.db
                    .query(convexTable)
                    .withIndex('by_record_id', (q: Ctx) => q.eq('id', id))
                    .unique();
                if (existing) {
                    const { id: _, ...updateData } = record;
                    await ctx.db.patch(existing._id, updateData);
                } else {
                    await ctx.db.insert(convexTable, record);
                }
            }
            return { ok: true };
        }
        case 'load': {
            const keys = request.keys;
            if (keys.id) {
                const doc = await ctx.db
                    .query(convexTable)
                    .withIndex('by_record_id', (q: Ctx) => q.eq('id', keys.id))
                    .unique();
                return { ok: true, result: doc || null };
            }
            const docs = await ctx.db.query(convexTable).take(10_000);
            const match = docs.find((doc: Record<string, unknown>) =>
                Object.entries(keys).every(
                    ([key, value]) => doc[key] === value,
                ),
            );
            return { ok: true, result: match || null };
        }
        case 'queryTable': {
            const maxDocs = request.limit
                ? Math.min(request.limit * 2, 10_000)
                : 10_000;
            let docs = await ctx.db.query(convexTable).take(maxDocs);
            if (request.filters && request.filters.length > 0) {
                docs = docs.filter((doc: Record<string, unknown>) =>
                    request.filters.every(
                        (filter: { field: string; value: unknown }) =>
                            doc[filter.field] === filter.value,
                    ),
                );
            }
            if (request.limit) {
                docs = docs.slice(0, request.limit);
            }
            return { ok: true, result: docs };
        }
        case 'clearTable':
        case 'dropTable': {
            const BATCH_SIZE = 25;
            const docs = await ctx.db.query(convexTable).take(BATCH_SIZE + 1);
            const hasMore = docs.length > BATCH_SIZE;
            const docsToDelete = hasMore
                ? docs.slice(0, BATCH_SIZE)
                : docs;
            for (const doc of docsToDelete) {
                await ctx.db.delete(doc._id);
            }
            return { ok: true, hasMore };
        }
        case 'deleteMany': {
            for (const id of request.ids) {
                const doc = await ctx.db
                    .query(convexTable)
                    .withIndex('by_record_id', (q: Ctx) => q.eq('id', id))
                    .unique();
                if (doc) {
                    await ctx.db.delete(doc._id);
                }
            }
            return { ok: true };
        }
        default:
            return { ok: false, error: `Unsupported operation ${request.op}` };
    }
}

async function handleVectorOperation(ctx: Ctx, request: Request) {
    const indexName = request.tableName.replace(VECTOR_TABLE_PREFIX, '');
    const convexTable = 'mastra_vectors';

    switch (request.op) {
        case 'insert': {
            const record = request.record;
            const id = record.id;
            if (!id) throw new Error('Vector record is missing an id');
            const existing = await ctx.db
                .query(convexTable)
                .withIndex('by_index_id', (q: Ctx) =>
                    q.eq('indexName', indexName).eq('id', id),
                )
                .unique();
            if (existing) {
                await ctx.db.patch(existing._id, {
                    embedding: record.embedding,
                    metadata: record.metadata,
                });
            } else {
                await ctx.db.insert(convexTable, {
                    id,
                    indexName,
                    embedding: record.embedding,
                    metadata: record.metadata,
                });
            }
            return { ok: true };
        }
        case 'batchInsert': {
            for (const record of request.records) {
                const id = record.id;
                if (!id) continue;
                const existing = await ctx.db
                    .query(convexTable)
                    .withIndex('by_index_id', (q: Ctx) =>
                        q.eq('indexName', indexName).eq('id', id),
                    )
                    .unique();
                if (existing) {
                    await ctx.db.patch(existing._id, {
                        embedding: record.embedding,
                        metadata: record.metadata,
                    });
                } else {
                    await ctx.db.insert(convexTable, {
                        id,
                        indexName,
                        embedding: record.embedding,
                        metadata: record.metadata,
                    });
                }
            }
            return { ok: true };
        }
        case 'load': {
            const keys = request.keys;
            if (keys.id) {
                const doc = await ctx.db
                    .query(convexTable)
                    .withIndex('by_index_id', (q: Ctx) =>
                        q.eq('indexName', indexName).eq('id', keys.id),
                    )
                    .unique();
                return { ok: true, result: doc || null };
            }
            return { ok: true, result: null };
        }
        case 'queryTable': {
            const maxDocs = request.limit
                ? Math.min(request.limit * 2, 10_000)
                : 10_000;
            let docs = await ctx.db
                .query(convexTable)
                .withIndex('by_index', (q: Ctx) =>
                    q.eq('indexName', indexName),
                )
                .take(maxDocs);
            if (request.filters && request.filters.length > 0) {
                docs = docs.filter((doc: Record<string, unknown>) =>
                    request.filters.every(
                        (filter: { field: string; value: unknown }) =>
                            doc[filter.field] === filter.value,
                    ),
                );
            }
            if (request.limit) {
                docs = docs.slice(0, request.limit);
            }
            return { ok: true, result: docs };
        }
        case 'clearTable':
        case 'dropTable': {
            const BATCH_SIZE = 25;
            const docs = await ctx.db
                .query(convexTable)
                .withIndex('by_index', (q: Ctx) =>
                    q.eq('indexName', indexName),
                )
                .take(BATCH_SIZE + 1);
            const hasMore = docs.length > BATCH_SIZE;
            const docsToDelete = hasMore
                ? docs.slice(0, BATCH_SIZE)
                : docs;
            for (const doc of docsToDelete) {
                await ctx.db.delete(doc._id);
            }
            return { ok: true, hasMore };
        }
        case 'deleteMany': {
            for (const id of request.ids) {
                const doc = await ctx.db
                    .query(convexTable)
                    .withIndex('by_index_id', (q: Ctx) =>
                        q.eq('indexName', indexName).eq('id', id),
                    )
                    .unique();
                if (doc) {
                    await ctx.db.delete(doc._id);
                }
            }
            return { ok: true };
        }
        default:
            return { ok: false, error: `Unsupported operation ${request.op}` };
    }
}

async function handleGenericOperation(ctx: Ctx, request: Request) {
    const tableName = request.tableName;
    const convexTable = 'mastra_documents';

    switch (request.op) {
        case 'insert': {
            const record = request.record;
            if (!record.id)
                throw new Error(
                    `Record for table ${tableName} is missing an id`,
                );
            const primaryKey = String(record.id);
            const existing = await ctx.db
                .query(convexTable)
                .withIndex('by_table_primary', (q: Ctx) =>
                    q.eq('table', tableName).eq('primaryKey', primaryKey),
                )
                .unique();
            if (existing) {
                await ctx.db.patch(existing._id, { record });
            } else {
                await ctx.db.insert(convexTable, {
                    table: tableName,
                    primaryKey,
                    record,
                });
            }
            return { ok: true };
        }
        case 'batchInsert': {
            for (const record of request.records) {
                if (!record.id) continue;
                const primaryKey = String(record.id);
                const existing = await ctx.db
                    .query(convexTable)
                    .withIndex('by_table_primary', (q: Ctx) =>
                        q.eq('table', tableName).eq('primaryKey', primaryKey),
                    )
                    .unique();
                if (existing) {
                    await ctx.db.patch(existing._id, { record });
                } else {
                    await ctx.db.insert(convexTable, {
                        table: tableName,
                        primaryKey,
                        record,
                    });
                }
            }
            return { ok: true };
        }
        case 'load': {
            const keys = request.keys;
            if (keys.id) {
                const existing = await ctx.db
                    .query(convexTable)
                    .withIndex('by_table_primary', (q: Ctx) =>
                        q
                            .eq('table', tableName)
                            .eq('primaryKey', String(keys.id)),
                    )
                    .unique();
                return { ok: true, result: existing ? existing.record : null };
            }
            const docs = await ctx.db
                .query(convexTable)
                .withIndex('by_table', (q: Ctx) => q.eq('table', tableName))
                .take(10_000);
            const match = docs.find((doc: Record<string, unknown>) =>
                Object.entries(keys).every(
                    ([key, value]) =>
                        (doc.record as Record<string, unknown>)?.[key] ===
                        value,
                ),
            );
            return { ok: true, result: match ? match.record : null };
        }
        case 'queryTable': {
            const maxDocs = request.limit
                ? Math.min(request.limit * 2, 10_000)
                : 10_000;
            const docs = await ctx.db
                .query(convexTable)
                .withIndex('by_table', (q: Ctx) => q.eq('table', tableName))
                .take(maxDocs);
            let records = docs.map(
                (doc: Record<string, unknown>) => doc.record,
            );
            if (request.filters && request.filters.length > 0) {
                records = records.filter(
                    (record: Record<string, unknown> | undefined) =>
                        request.filters.every(
                            (filter: { field: string; value: unknown }) =>
                                record?.[filter.field] === filter.value,
                        ),
                );
            }
            if (request.limit) {
                records = records.slice(0, request.limit);
            }
            return { ok: true, result: records };
        }
        case 'clearTable':
        case 'dropTable': {
            const BATCH_SIZE = 25;
            const docs = await ctx.db
                .query(convexTable)
                .withIndex('by_table', (q: Ctx) => q.eq('table', tableName))
                .take(BATCH_SIZE + 1);
            const hasMore = docs.length > BATCH_SIZE;
            const docsToDelete = hasMore
                ? docs.slice(0, BATCH_SIZE)
                : docs;
            for (const doc of docsToDelete) {
                await ctx.db.delete(doc._id);
            }
            return { ok: true, hasMore };
        }
        case 'deleteMany': {
            for (const id of request.ids) {
                const existing = await ctx.db
                    .query(convexTable)
                    .withIndex('by_table_primary', (q: Ctx) =>
                        q
                            .eq('table', tableName)
                            .eq('primaryKey', String(id)),
                    )
                    .unique();
                if (existing) {
                    await ctx.db.delete(existing._id);
                }
            }
            return { ok: true };
        }
        default:
            return { ok: false, error: `Unsupported operation ${request.op}` };
    }
}

export const handle = mutationGeneric(async (ctx, request: Request) => {
    try {
        const { convexTable, isTyped } = resolveTable(request.tableName);

        if (
            request.tableName.startsWith(VECTOR_TABLE_PREFIX) &&
            request.tableName !== TABLE_VECTOR_INDEXES
        ) {
            return handleVectorOperation(ctx, request);
        }

        if (isTyped) {
            return handleTypedOperation(ctx, convexTable, request);
        }

        return handleGenericOperation(ctx, request);
    } catch (error) {
        const err = error as Error;
        return { ok: false, error: err.message };
    }
});
