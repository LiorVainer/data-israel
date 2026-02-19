/**
 * Convex Database Schema
 *
 * Defines tables for datasets and resources from data.gov.il
 */

import { defineSchema, defineTable } from 'convex/server';
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

export default defineSchema({
    /**
     * Guests table - stores guest session information for unauthenticated users
     */
    guests: defineTable({
        sessionId: v.string(),
        createdAt: v.number(),
    }).index('by_session_id', ['sessionId']),

    /**
     * Datasets table - stores metadata for all data.gov.il datasets
     */
    datasets: defineTable({
        ckanId: v.string(), // Original data.gov.il ID
        title: v.string(),
        name: v.string(),
        notes: v.optional(v.string()),
        organizationId: v.optional(v.string()),
        organizationTitle: v.optional(v.string()),
        tags: v.array(v.string()),
        metadataCreated: v.optional(v.string()),
        metadataModified: v.optional(v.string()),
        author: v.optional(v.string()),
        maintainer: v.optional(v.string()),
        licenseTitle: v.optional(v.string()),
    })
        .index('by_ckan_id', ['ckanId'])
        .index('by_organization', ['organizationId']),

    /**
     * Resources table - stores metadata for dataset resources (files)
     * Linked to datasets via datasetId foreign key
     */
    resources: defineTable({
        ckanId: v.string(), // Original resource ID
        datasetId: v.id('datasets'), // Foreign key to datasets table
        datasetCkanId: v.string(), // Original dataset ID for reference
        name: v.optional(v.string()),
        url: v.string(),
        format: v.string(),
        description: v.optional(v.string()),
        size: v.optional(v.number()),
        created: v.optional(v.string()),
        lastModified: v.optional(v.string()),
    })
        .index('by_dataset', ['datasetId'])
        .index('by_ckan_id', ['ckanId'])
        .index('by_format', ['format']),

    /**
     * Users table - stores Clerk user information and preferences
     */
    users: defineTable({
        clerkId: v.string(),
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        themePreference: v.optional(v.union(v.literal('light'), v.literal('dark'))),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_clerk_id', ['clerkId']),

    /**
     * Thread context table - tracks context window consumption per thread interaction.
     * Each record is a snapshot of the context window size at the end of a turn.
     */
    thread_usage: defineTable({
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
        .index('by_user', ['userId']),

    /**
     * Thread billing table - tracks accumulated token usage (actual API cost) per turn.
     * Unlike thread_usage (context window snapshot), this records the sum of all
     * step tokens consumed in a single turn — the real billing cost.
     */
    thread_billing: defineTable({
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
        .index('by_user', ['userId']),

    /**
     * Mastra tables - used by @mastra/convex for agent memory, threads, and storage
     */
    mastra_threads: mastraThreadsTable,
    mastra_messages: mastraMessagesTable,
    mastra_resources: mastraResourcesTable,
    mastra_workflow_snapshots: mastraWorkflowSnapshotsTable,
    mastra_scorers: mastraScoresTable,
    mastra_vector_indexes: mastraVectorIndexesTable,
    mastra_vectors: mastraVectorsTable,
    mastra_documents: mastraDocumentsTable,
});
