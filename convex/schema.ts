/**
 * Convex Database Schema
 *
 * Defines tables for datasets and resources from data.gov.il.
 * Uses better-convex ORM for type-safe table definitions where possible,
 * with raw defineTable for tables using complex external validators (vUsage, vProviderMetadata).
 */

import {
    convexTable,
    custom,
    defineRelations,
    defineSchema,
    id,
    index,
    integer,
    text,
    textEnum,
} from 'better-convex/orm';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { vUsage, vProviderMetadata } from '@convex-dev/agent';
import {
    mastraThreadsTable,
    mastraMessagesTable,
    mastraResourcesTable,
    mastraWorkflowSnapshotsTable,
    mastraScoresTable,
    mastraVectorIndexesTable,
    mastraVectorsTable,
    mastraDocumentsTable,
} from '@mastra/convex/schema';

// --- ORM Tables ---

/**
 * Guests table - stores guest session information for unauthenticated users
 */
export const guests = convexTable('guests', {
    sessionId: text().notNull(),
    createdAt: integer().notNull(),
}, (t) => [index('by_session_id').on(t.sessionId)]);

/**
 * Datasets table - stores metadata for all data.gov.il datasets
 */
export const datasets = convexTable('datasets', {
    ckanId: text().notNull(),
    title: text().notNull(),
    name: text().notNull(),
    notes: text(),
    organizationId: text(),
    organizationTitle: text(),
    tags: custom(v.array(v.string())).notNull(),
    metadataCreated: text(),
    metadataModified: text(),
    author: text(),
    maintainer: text(),
    licenseTitle: text(),
}, (t) => [
    index('by_ckan_id').on(t.ckanId),
    index('by_organization').on(t.organizationId),
]);

/**
 * Resources table - stores metadata for dataset resources (files)
 * Linked to datasets via datasetId foreign key
 */
export const resources = convexTable('resources', {
    ckanId: text().notNull(),
    datasetId: id('datasets').notNull(),
    datasetCkanId: text().notNull(),
    name: text(),
    url: text().notNull(),
    format: text().notNull(),
    description: text(),
    size: integer(),
    created: text(),
    lastModified: text(),
}, (t) => [
    index('by_dataset').on(t.datasetId),
    index('by_ckan_id').on(t.ckanId),
    index('by_format').on(t.format),
]);

/**
 * Users table - stores Clerk user information and preferences
 */
export const users = convexTable('users', {
    clerkId: text().notNull(),
    email: text().notNull(),
    firstName: text(),
    lastName: text(),
    imageUrl: text(),
    themePreference: textEnum(['light', 'dark']),
    createdAt: integer().notNull(),
    updatedAt: integer().notNull(),
}, (t) => [index('by_clerk_id').on(t.clerkId)]);

// --- Raw defineTable tables (use complex external validators) ---

/**
 * Thread context table - tracks context window consumption per thread interaction.
 * Each record is a snapshot of the context window size at the end of a turn.
 * Uses vUsage/vProviderMetadata from @convex-dev/agent which cannot be expressed in ORM types.
 */
const thread_usage = defineTable({
    threadId: v.string(),
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    usage: vUsage,
    providerMetadata: v.optional(vProviderMetadata),
    createdAt: v.number(),
})
    .index('by_thread', ['threadId'])
    .index('by_thread_created', ['threadId', 'createdAt'])
    .index('by_user', ['userId']);

/**
 * Thread billing table - tracks accumulated token usage (actual API cost) per turn.
 * Unlike thread_usage (context window snapshot), this records the sum of all
 * step tokens consumed in a single turn - the real billing cost.
 * Uses vUsage from @convex-dev/agent which cannot be expressed in ORM types.
 */
const thread_billing = defineTable({
    threadId: v.string(),
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    usage: vUsage,
    createdAt: v.number(),
})
    .index('by_thread', ['threadId'])
    .index('by_thread_created', ['threadId', 'createdAt'])
    .index('by_user', ['userId']);

// --- Schema Definition ---

/**
 * Combined schema: ORM tables + raw defineTable tables + Mastra tables.
 * strict: false allows mixing convexTable and defineTable, and permits Mastra table imports.
 *
 * CRITICAL: Table order must be preserved - never insert new tables in the middle.
 * Convex internal ID numbering depends on table order.
 */
export default defineSchema(
    {
        // ORM tables (order preserved from original schema)
        guests,
        datasets,
        resources,
        users,

        // Raw defineTable tables (complex validators)
        thread_usage,
        thread_billing,

        // Mastra tables - used by @mastra/convex for agent memory, threads, and storage
        mastra_threads: mastraThreadsTable,
        mastra_messages: mastraMessagesTable,
        mastra_resources: mastraResourcesTable,
        mastra_workflow_snapshots: mastraWorkflowSnapshotsTable,
        mastra_scorers: mastraScoresTable,
        mastra_vector_indexes: mastraVectorIndexesTable,
        mastra_vectors: mastraVectorsTable,
        mastra_documents: mastraDocumentsTable,
    },
    { strict: false },
);

// --- Relations ---

/**
 * Defines relationships between ORM tables for typed queries.
 * Only ORM tables (convexTable instances) participate in relations.
 */
export const relations = defineRelations(
    { guests, datasets, resources, users },
    (r) => ({
        datasets: {
            resources: r.many.resources(),
        },
        resources: {
            dataset: r.one.datasets({
                from: r.resources.datasetId,
                to: r.datasets.id,
            }),
        },
    }),
);
