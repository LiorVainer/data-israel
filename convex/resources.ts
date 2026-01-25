/**
 * Resource Convex Functions
 *
 * CRUD operations for resources table
 */

import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';

/**
 * Get a resource by its CKAN ID
 */
export const getByCkanId = query({
    args: { ckanId: v.string() },
    handler: async (ctx, { ckanId }) => {
        return await ctx.db
            .query('resources')
            .withIndex('by_ckan_id', (q) => q.eq('ckanId', ckanId))
            .first();
    },
});

/**
 * Get a resource by its Convex ID
 */
export const get = query({
    args: { id: v.id('resources') },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

/**
 * List resources for a specific dataset
 */
export const listByDataset = query({
    args: { datasetId: v.id('datasets') },
    handler: async (ctx, { datasetId }) => {
        return await ctx.db
            .query('resources')
            .withIndex('by_dataset', (q) => q.eq('datasetId', datasetId))
            .collect();
    },
});

/**
 * List resources by format
 */
export const listByFormat = query({
    args: { format: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, { format, limit = 100 }) => {
        return await ctx.db
            .query('resources')
            .withIndex('by_format', (q) => q.eq('format', format.toUpperCase()))
            .take(limit);
    },
});

/**
 * Count total resources
 */
export const count = query({
    args: {},
    handler: async (ctx) => {
        const resources = await ctx.db.query('resources').collect();
        return resources.length;
    },
});

/**
 * Insert or update a resource (upsert by ckanId)
 */
export const upsert = mutation({
    args: {
        ckanId: v.string(),
        datasetId: v.id('datasets'),
        datasetCkanId: v.string(),
        name: v.optional(v.string()),
        url: v.string(),
        format: v.string(),
        description: v.optional(v.string()),
        size: v.optional(v.number()),
        created: v.optional(v.string()),
        lastModified: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('resources')
            .withIndex('by_ckan_id', (q) => q.eq('ckanId', args.ckanId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, args);
            return existing._id;
        } else {
            return await ctx.db.insert('resources', args);
        }
    },
});

/**
 * Internal mutation for batch insert (used by sync scripts)
 */
export const batchInsert = internalMutation({
    args: {
        resources: v.array(
            v.object({
                ckanId: v.string(),
                datasetId: v.id('datasets'),
                datasetCkanId: v.string(),
                name: v.optional(v.string()),
                url: v.string(),
                format: v.string(),
                description: v.optional(v.string()),
                size: v.optional(v.number()),
                created: v.optional(v.string()),
                lastModified: v.optional(v.string()),
            }),
        ),
    },
    handler: async (ctx, { resources }) => {
        const ids = [];
        for (const resource of resources) {
            const existing = await ctx.db
                .query('resources')
                .withIndex('by_ckan_id', (q) => q.eq('ckanId', resource.ckanId))
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, resource);
                ids.push(existing._id);
            } else {
                const id = await ctx.db.insert('resources', resource);
                ids.push(id);
            }
        }
        return ids;
    },
});

/**
 * Delete all resources for a dataset
 */
export const deleteByDataset = mutation({
    args: { datasetId: v.id('datasets') },
    handler: async (ctx, { datasetId }) => {
        const resources = await ctx.db
            .query('resources')
            .withIndex('by_dataset', (q) => q.eq('datasetId', datasetId))
            .collect();

        for (const resource of resources) {
            await ctx.db.delete(resource._id);
        }

        return resources.length;
    },
});
