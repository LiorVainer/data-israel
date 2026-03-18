/**
 * Search Resources Tool
 *
 * AI SDK tool for semantic search of resources using Convex RAG
 * Falls back to CKAN API if Convex is unavailable or empty
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { convexClient, api } from '@/lib/convex/client';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '@/lib/api/data-gov/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const searchResourcesInputSchema = z.object({
    query: z
        .string()
        .describe('Search query - can be natural language (e.g., "CSV files about schools", "education data")'),
    datasetId: z.string().optional().describe('Filter by dataset CKAN ID to search within a specific dataset'),
    format: z.string().optional().describe('Filter by file format (e.g., "csv", "json", "xlsx")'),
    limit: z.number().int().min(1).max(100).optional().describe('Maximum number of resources to return (default 10)'),
    searchedResourceName: z
        .string()
        .describe(
            'Hebrew label describing what is being searched (e.g., "קבצי CSV", "נתוני חינוך"). Shown in UI as chip label.',
        ),
});

export const searchResourcesOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        count: z.number(),
        source: z.enum(['convex-rag', 'ckan-api', 'ckan-api-fallback']),
        resources: z.array(
            z.object({
                id: z.string(),
                name: z.string(),
                url: z.string(),
                format: z.string(),
                description: z.string(),
                datasetId: z.string(),
            }),
        ),
        apiUrl: z.string().optional(),
        searchedResourceName: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional(),
        searchedResourceName: z.string(),
    }),
]);

export type SearchResourcesInput = z.infer<typeof searchResourcesInputSchema>;
export type SearchResourcesOutput = z.infer<typeof searchResourcesOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

/** Minimum RAG score to consider a result relevant */
const RAG_MIN_SCORE = 0.5;

export const searchResources = createTool({
    id: 'searchResources',
    description:
        'Search for resources (files) on data.gov.il. Use short 1-2 keyword queries for best results. Returns matching resources ranked by relevance.',
    inputSchema: searchResourcesInputSchema,
    execute: async ({ query, datasetId, format, limit = 10, searchedResourceName }) => {
        // Build CKAN query format for URL construction
        const ckanQuery = format ? `format:${format}` : `name:${query}`;
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.resource.search, {
            query: ckanQuery,
            limit,
        });

        // Run RAG and CKAN in parallel
        const [ragResult, ckanResult] = await Promise.allSettled([
            convexClient.action(api.search.searchResources, {
                query,
                datasetId,
                format,
                limit,
            }),
            dataGovApi.resource.search({ query: ckanQuery, limit }),
        ]);

        // Collect RAG results above score threshold
        const ragResources =
            ragResult.status === 'fulfilled' && ragResult.value.success
                ? ragResult.value.resources.filter((r: { score?: number }) => (r.score ?? 0) >= RAG_MIN_SCORE)
                : [];

        // Collect CKAN results (defensive: API may return malformed response without results array)
        const ckanResources =
            ckanResult.status === 'fulfilled' && Array.isArray(ckanResult.value?.results)
                ? ckanResult.value.results.map((r) => ({
                      id: r.id,
                      name: r.name || '',
                      url: r.url,
                      format: r.format,
                      description: r.description || '',
                      datasetId: r.package_id || '',
                  }))
                : [];

        // Merge: deduplicate by resource ID, CKAN first
        const seenIds = new Set<string>();
        const merged: Array<{
            id: string;
            name: string;
            url: string;
            format: string;
            description: string;
            datasetId: string;
        }> = [];

        for (const r of ckanResources) {
            if (!seenIds.has(r.id)) {
                seenIds.add(r.id);
                merged.push(r);
            }
        }

        for (const r of ragResources) {
            const id = (r as { id?: string }).id ?? '';
            if (id && !seenIds.has(id)) {
                seenIds.add(id);
                merged.push({
                    id,
                    name: (r as { name?: string }).name ?? '',
                    url: '',
                    format: '',
                    description: (r as { matchedText?: string }).matchedText ?? '',
                    datasetId: (r as { datasetId?: string }).datasetId ?? '',
                });
            }
        }

        const finalResources = merged.slice(0, limit);

        if (finalResources.length > 0) {
            return {
                success: true,
                count: finalResources.length,
                source: ckanResources.length > 0 ? 'ckan-api' : 'convex-rag',
                resources: finalResources,
                apiUrl,
                searchedResourceName,
            } as const;
        }

        return {
            success: false,
            error: 'No resources found for query',
            apiUrl,
            searchedResourceName,
        } as const;
    },
});
