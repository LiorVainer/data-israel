/**
 * Dataset Convex Functions
 *
 * CRUD operations for datasets table
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Get a dataset by its CKAN ID
 */
export const getByCkanId = query({
  args: { ckanId: v.string() },
  handler: async (ctx, { ckanId }) => {
    return await ctx.db
      .query("datasets")
      .withIndex("by_ckan_id", (q) => q.eq("ckanId", ckanId))
      .first();
  },
});

/**
 * Get a dataset by its Convex ID
 */
export const get = query({
  args: { id: v.id("datasets") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/**
 * List all datasets with pagination
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 100 }) => {
    const datasets = await ctx.db.query("datasets").take(limit);
    return datasets;
  },
});

/**
 * Count total datasets
 */
export const count = query({
  args: {},
  handler: async (ctx) => {
    const datasets = await ctx.db.query("datasets").collect();
    return datasets.length;
  },
});

/**
 * Insert or update a dataset (upsert by ckanId)
 */
export const upsert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("datasets")
      .withIndex("by_ckan_id", (q) => q.eq("ckanId", args.ckanId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("datasets", args);
    }
  },
});

/**
 * Internal mutation for batch insert (used by sync scripts)
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
      })
    ),
  },
  handler: async (ctx, { datasets }) => {
    const ids = [];
    for (const dataset of datasets) {
      const existing = await ctx.db
        .query("datasets")
        .withIndex("by_ckan_id", (q) => q.eq("ckanId", dataset.ckanId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, dataset);
        ids.push(existing._id);
      } else {
        const id = await ctx.db.insert("datasets", dataset);
        ids.push(id);
      }
    }
    return ids;
  },
});

/**
 * Delete a dataset by CKAN ID
 */
export const deleteByCkanId = mutation({
  args: { ckanId: v.string() },
  handler: async (ctx, { ckanId }) => {
    const dataset = await ctx.db
      .query("datasets")
      .withIndex("by_ckan_id", (q) => q.eq("ckanId", ckanId))
      .first();

    if (dataset) {
      await ctx.db.delete(dataset._id);
      return true;
    }
    return false;
  },
});
