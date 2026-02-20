/**
 * Dataset Convex Functions
 *
 * CRUD operations for datasets table.
 * Uses cRPC procedure builders with Zod validation.
 * batchInsert remains as vanilla internalMutation (called from sync scripts).
 */

import { z } from 'zod';
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { publicMutation, publicQuery } from './lib/crpc';

/**
 * Get a dataset by its CKAN ID
 */
export const getByCkanId = publicQuery
    .input(z.object({ ckanId: z.string() }))
    .query(async ({ ctx, input }) => {
        return await ctx.db
            .query('datasets')
            .withIndex('by_ckan_id', (q) => q.eq('ckanId', input.ckanId))
            .first();
    });

/**
 * Get a dataset by its Convex ID
 */
export const get = publicQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
        const normalizedId = ctx.db.normalizeId('datasets', input.id);
        if (!normalizedId) return null;
        return await ctx.db.get(normalizedId);
    });

/**
 * List all datasets with pagination
 */
export const list = publicQuery
    .input(z.object({ limit: z.number().optional(), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
        const limit = input.limit ?? 100;
        const datasets = await ctx.db.query('datasets').take(limit);
        return datasets;
    });

/**
 * Count total datasets
 */
export const count = publicQuery
    .query(async ({ ctx }) => {
        const datasets = await ctx.db.query('datasets').collect();
        return datasets.length;
    });

const zDatasetInput = z.object({
    ckanId: z.string(),
    title: z.string(),
    name: z.string(),
    notes: z.string().optional(),
    organizationId: z.string().optional(),
    organizationTitle: z.string().optional(),
    tags: z.array(z.string()),
    metadataCreated: z.string().optional(),
    metadataModified: z.string().optional(),
    author: z.string().optional(),
    maintainer: z.string().optional(),
    licenseTitle: z.string().optional(),
});

/**
 * Insert or update a dataset (upsert by ckanId)
 */
export const upsert = publicMutation
    .input(zDatasetInput)
    .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db
            .query('datasets')
            .withIndex('by_ckan_id', (q) => q.eq('ckanId', input.ckanId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, input);
            return existing._id;
        } else {
            return await ctx.db.insert('datasets', input);
        }
    });

/**
 * Internal mutation for batch insert (used by sync scripts).
 * Kept as vanilla internalMutation - not migrated to cRPC.
 */
export const batchInsert = internalMutation({
    args: {
        datasets: v.array(
            v.object({
                ckanId: v.string(),
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
            }),
        ),
    },
    handler: async (ctx, { datasets }) => {
        const ids = [];
        for (const dataset of datasets) {
            const existing = await ctx.db
                .query('datasets')
                .withIndex('by_ckan_id', (q) => q.eq('ckanId', dataset.ckanId))
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, dataset);
                ids.push(existing._id);
            } else {
                const id = await ctx.db.insert('datasets', dataset);
                ids.push(id);
            }
        }
        return ids;
    },
});

/**
 * Delete a dataset by CKAN ID
 */
export const deleteByCkanId = publicMutation
    .input(z.object({ ckanId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        const dataset = await ctx.db
            .query('datasets')
            .withIndex('by_ckan_id', (q) => q.eq('ckanId', input.ckanId))
            .first();

        if (dataset) {
            await ctx.db.delete(dataset._id);
            return true;
        }
        return false;
    });
