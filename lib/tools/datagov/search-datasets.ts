/**
 * Search Datasets Tool
 *
 * AI SDK tool for semantic search of datasets using Convex RAG
 * Falls back to CKAN API if Convex is unavailable or empty
 */

import { tool } from 'ai';
import { z } from 'zod';
import { convexClient, api } from '@/lib/convex/client';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '@/lib/api/data-gov/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const searchDatasetsInputSchema = z.object({
    query: z
        .string()
        .describe('Search query - can be natural language (e.g., "health data", "transportation statistics")'),
    organization: z.string().optional().describe('Filter by organization ID'),
    tag: z.string().optional().describe('Filter by tag name'),
    limit: z.number().int().min(1).max(100).optional().describe('Number of results to return (default 10)'),
    searchedResourceName: z
        .string()
        .describe('Hebrew label describing what is being searched (e.g., "מאגרי תחבורה", "נתוני בריאות"). Shown in UI as chip label.'),
});

export const searchDatasetsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        count: z.number(),
        source: z.enum(['convex-rag', 'ckan-api', 'ckan-api-fallback']),
        datasets: z.array(
            z.object({
                id: z.string(),
                title: z.string(),
                organization: z.string(),
                tags: z.array(z.string()),
                summary: z.string(),
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

export type SearchDatasetsInput = z.infer<typeof searchDatasetsInputSchema>;
export type SearchDatasetsOutput = z.infer<typeof searchDatasetsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const searchDatasets = tool({
    description:
        'Search for datasets on data.gov.il using semantic search. Use this when user asks about datasets related to a topic or keyword. Returns matching datasets ranked by relevance.',
    inputSchema: searchDatasetsInputSchema,
    execute: async ({ query, organization, tag, limit = 10, searchedResourceName }) => {
        // Build CKAN API URL for when it's used
        const ckanApiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.search, {
            q: query,
            rows: limit,
            start: 0,
        });

        try {
            // Try Convex RAG semantic search first
            const convexResult = await convexClient.action(api.search.searchDatasets, {
                query,
                organization,
                tag,
                limit,
            });

            if (convexResult.success && convexResult.count > 0) {
                // Convex RAG source - no apiUrl since it's internal
                return {
                    success: true,
                    count: convexResult.count,
                    source: 'convex-rag',
                    datasets: convexResult.datasets,
                    searchedResourceName,
                };
            }

            // Fallback to CKAN API if Convex has no results
            const ckanResult = await dataGovApi.dataset.search({
                q: query,
                rows: limit,
                start: 0,
            });

            return {
                success: true,
                count: ckanResult.count,
                source: 'ckan-api',
                datasets: ckanResult.results.map((d) => ({
                    id: d.id,
                    title: d.title,
                    organization: d.organization?.title || 'Unknown',
                    tags: d.tags.map((t) => t.name),
                    summary: d.notes?.slice(0, 200) || '',
                })),
                apiUrl: ckanApiUrl,
                searchedResourceName,
            };
        } catch (error) {
            // If Convex fails, try CKAN as fallback
            try {
                const ckanResult = await dataGovApi.dataset.search({
                    q: query,
                    rows: limit,
                    start: 0,
                });

                return {
                    success: true,
                    count: ckanResult.count,
                    source: 'ckan-api-fallback',
                    datasets: ckanResult.results.map((d) => ({
                        id: d.id,
                        title: d.title,
                        organization: d.organization?.title || 'Unknown',
                        tags: d.tags.map((t) => t.name),
                        summary: d.notes?.slice(0, 200) || '',
                    })),
                    apiUrl: ckanApiUrl,
                    searchedResourceName,
                };
            } catch {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    apiUrl: ckanApiUrl,
                    searchedResourceName,
                };
            }
        }
    },
});
