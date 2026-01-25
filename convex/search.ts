/**
 * Search Convex Functions
 *
 * RAG-powered semantic search for datasets and resources
 */

import { v } from 'convex/values';
import { action } from './_generated/server';
import { datasetRag, resourceRag } from './rag';

/**
 * Semantic search for datasets
 * Returns datasets ranked by semantic relevance to the query
 */
export const searchDatasets = action({
    args: {
        query: v.string(),
        organization: v.optional(v.string()),
        tag: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { query, organization, tag, limit = 10 }) => {
        // Build filters array
        const filters: Array<{ name: 'organization' | 'tag'; value: string }> = [];

        if (organization) {
            filters.push({ name: 'organization', value: organization });
        }
        if (tag) {
            filters.push({ name: 'tag', value: tag });
        }

        const { results, entries } = await datasetRag.search(ctx, {
            namespace: 'datasets',
            query,
            filters: filters.length > 0 ? filters : undefined,
            limit,
        });

        // Map results to dataset format
        return {
            success: true,
            count: results.length,
            datasets: results.map((result, index) => ({
                id: entries[index]?.metadata?.ckanId || '',
                title: entries[index]?.metadata?.title || '',
                organization: entries[index]?.metadata?.organizationTitle || 'Unknown',
                score: result.score,
                matchedText: result.content?.[0]?.text?.slice(0, 200) || '',
            })),
        };
    },
});

/**
 * Semantic search for resources
 * Returns resources ranked by semantic relevance to the query
 */
export const searchResources = action({
    args: {
        query: v.string(),
        datasetId: v.optional(v.string()),
        format: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { query, datasetId, format, limit = 10 }) => {
        // Build filters array
        const filters: Array<{ name: 'datasetId' | 'format'; value: string }> = [];

        if (datasetId) {
            filters.push({ name: 'datasetId', value: datasetId });
        }
        if (format) {
            filters.push({ name: 'format', value: format.toUpperCase() });
        }

        console.log('Searching resources with filters:', filters);

        const { results, entries } = await resourceRag.search(ctx, {
            namespace: 'resources',
            query,
            filters: filters.length > 0 ? filters : undefined,
            limit,
        });

        // Map results to resource format
        return {
            success: true,
            count: results.length,
            resources: results.map((result, index) => ({
                id: entries[index]?.metadata?.ckanId || '',
                name: entries[index]?.metadata?.name || '',
                datasetId: entries[index]?.metadata?.datasetCkanId || '',
                score: result.score,
                matchedText: result.content?.[0]?.text?.slice(0, 200) || '',
            })),
        };
    },
});

/**
 * Index a dataset for RAG search
 */
export const indexDataset = action({
    args: {
        ckanId: v.string(),
        title: v.string(),
        notes: v.optional(v.string()),
        tags: v.array(v.string()),
        organizationId: v.optional(v.string()),
        organizationTitle: v.optional(v.string()),
    },
    handler: async (ctx, { ckanId, title, notes, tags, organizationId, organizationTitle }) => {
        // Build searchable text from title, notes, and tags
        // Tags are included in text for semantic search
        const searchableText = [title, notes || '', ...tags].filter(Boolean).join(' ');

        // Build filter values - RAG requires ALL defined filters to be provided
        // Use empty string as default when no value is available
        const filterValues: Array<{
            name: 'organization' | 'tag';
            value: string;
        }> = [
            { name: 'organization', value: organizationId || '' },
            { name: 'tag', value: tags.length > 0 ? tags[0] : '' },
        ];

        await datasetRag.add(ctx, {
            namespace: 'datasets',
            key: ckanId, // Use ckanId as key to prevent duplicates (upsert behavior)
            text: searchableText,
            filterValues,
            metadata: {
                ckanId,
                title,
                organizationTitle,
            },
        });

        return { success: true, ckanId };
    },
});

/**
 * Index a resource for RAG search
 */
export const indexResource = action({
    args: {
        ckanId: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        format: v.string(),
        datasetCkanId: v.string(),
    },
    handler: async (ctx, { ckanId, name, description, format, datasetCkanId }) => {
        // Build searchable text from name and description
        const searchableText = [name || '', description || ''].filter(Boolean).join(' ');

        // Skip if no searchable text
        if (!searchableText.trim()) {
            return { success: false, reason: 'No searchable text' };
        }

        // Build filter values
        const filterValues: Array<{
            name: 'datasetId' | 'format';
            value: string;
        }> = [
            { name: 'datasetId', value: datasetCkanId },
            { name: 'format', value: format.toUpperCase() },
        ];

        await resourceRag.add(ctx, {
            namespace: 'resources',
            key: ckanId, // Use ckanId as key to prevent duplicates (upsert behavior)
            text: searchableText,
            filterValues,
            metadata: {
                ckanId,
                name,
                datasetCkanId,
            },
        });

        return { success: true, ckanId };
    },
});

/**
 * Batch index datasets (for sync scripts)
 */
export const batchIndexDatasets = action({
    args: {
        datasets: v.array(
            v.object({
                ckanId: v.string(),
                title: v.string(),
                notes: v.optional(v.string()),
                tags: v.array(v.string()),
                organizationId: v.optional(v.string()),
                organizationTitle: v.optional(v.string()),
            }),
        ),
    },
    handler: async (ctx, { datasets }) => {
        let indexed = 0;
        const errors: string[] = [];

        for (const dataset of datasets) {
            try {
                // Tags are included in text for semantic search
                const searchableText = [dataset.title, dataset.notes || '', ...dataset.tags].filter(Boolean).join(' ');

                // RAG requires ALL defined filters to be provided
                const filterValues: Array<{
                    name: 'organization' | 'tag';
                    value: string;
                }> = [
                    { name: 'organization', value: dataset.organizationId || '' },
                    { name: 'tag', value: dataset.tags.length > 0 ? dataset.tags[0] : '' },
                ];

                await datasetRag.add(ctx, {
                    namespace: 'datasets',
                    key: dataset.ckanId, // Use ckanId as key to prevent duplicates (upsert behavior)
                    text: searchableText,
                    filterValues,
                    metadata: {
                        ckanId: dataset.ckanId,
                        title: dataset.title,
                        organizationTitle: dataset.organizationTitle,
                    },
                });

                indexed++;
            } catch (error) {
                errors.push(`${dataset.ckanId}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        return { indexed, errors };
    },
});
