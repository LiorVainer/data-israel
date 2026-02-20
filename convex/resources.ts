/**
 * Resource Convex Functions
 *
 * CRUD operations for resources table.
 * Uses cRPC procedure builders with Zod validation.
 * batchInsert remains as vanilla internalMutation (called from sync scripts).
 */

import { z } from 'zod';
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { publicMutation, publicQuery } from './lib/crpc';

/**
 * Get a resource by its CKAN ID
 */
export const getByCkanId = publicQuery
    .input(z.object({ ckanId: z.string() }))
    .query(async ({ ctx, input }) => {
        return await ctx.db
            .query('resources')
            .withIndex('by_ckan_id', (q) => q.eq('ckanId', input.ckanId))
            .first();
    });

/**
 * Get a resource by its Convex ID
 */
export const get = publicQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
        const normalizedId = ctx.db.normalizeId('resources', input.id);
        if (!normalizedId) return null;
        return await ctx.db.get(normalizedId);
    });

/**
 * List resources for a specific dataset
 */
export const listByDataset = publicQuery
    .input(z.object({ datasetId: z.string() }))
    .query(async ({ ctx, input }) => {
        const normalizedId = ctx.db.normalizeId('datasets', input.datasetId);
        if (!normalizedId) return [];
        return await ctx.db
            .query('resources')
            .withIndex('by_dataset', (q) => q.eq('datasetId', normalizedId))
            .collect();
    });

/**
 * List resources by format
 */
export const listByFormat = publicQuery
    .input(z.object({ format: z.string(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
        const limit = input.limit ?? 100;
        return await ctx.db
            .query('resources')
            .withIndex('by_format', (q) => q.eq('format', input.format.toUpperCase()))
            .take(limit);
    });

/**
 * Count total resources
 */
export const count = publicQuery
    .query(async ({ ctx }) => {
        const resources = await ctx.db.query('resources').collect();
        return resources.length;
    });

/**
 * Insert or update a resource (upsert by ckanId)
 */
export const upsert = publicMutation
    .input(
        z.object({
            ckanId: z.string(),
            datasetId: z.string(),
            datasetCkanId: z.string(),
            name: z.string().optional(),
            url: z.string(),
            format: z.string(),
            description: z.string().optional(),
            size: z.number().optional(),
            created: z.string().optional(),
            lastModified: z.string().optional(),
        }),
    )
    .mutation(async ({ ctx, input }) => {
        const normalizedDatasetId = ctx.db.normalizeId('datasets', input.datasetId);
        if (!normalizedDatasetId) {
            throw new Error(`Invalid dataset ID: ${input.datasetId}`);
        }

        const existing = await ctx.db
            .query('resources')
            .withIndex('by_ckan_id', (q) => q.eq('ckanId', input.ckanId))
            .first();

        const data = { ...input, datasetId: normalizedDatasetId };

        if (existing) {
            await ctx.db.patch(existing._id, data);
            return existing._id;
        } else {
            return await ctx.db.insert('resources', data);
        }
    });

/**
 * Internal mutation for batch insert (used by sync scripts).
 * Kept as vanilla internalMutation - not migrated to cRPC.
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
export const deleteByDataset = publicMutation
    .input(z.object({ datasetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        const normalizedId = ctx.db.normalizeId('datasets', input.datasetId);
        if (!normalizedId) return 0;

        const resources = await ctx.db
            .query('resources')
            .withIndex('by_dataset', (q) => q.eq('datasetId', normalizedId))
            .collect();

        for (const resource of resources) {
            await ctx.db.delete(resource._id);
        }

        return resources.length;
    });
