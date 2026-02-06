/**
 * Search Resources Tool
 *
 * AI SDK tool for semantic search of resources using Convex RAG
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

export const searchResourcesInputSchema = z.object({
    query: z
        .string()
        .describe('Search query - can be natural language (e.g., "CSV files about schools", "education data")'),
    datasetId: z.string().optional().describe('Filter by dataset CKAN ID to search within a specific dataset'),
    format: z.string().optional().describe('Filter by file format (e.g., "csv", "json", "xlsx")'),
    limit: z.number().int().min(1).max(100).optional().describe('Maximum number of resources to return (default 10)'),
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
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional(),
    }),
]);

export type SearchResourcesInput = z.infer<typeof searchResourcesInputSchema>;
export type SearchResourcesOutput = z.infer<typeof searchResourcesOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const searchResources = tool({
    description:
        'Search for resources (files) using semantic search. Use when user wants to find specific file types or resources across datasets.',
    inputSchema: searchResourcesInputSchema,
    execute: async ({ query, datasetId, format, limit = 10 }) => {
        // Build CKAN query format for URL construction
        const ckanQuery = format ? `format:${format}` : `name:${query}`;
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.resource.search, {
            query: ckanQuery,
            limit,
        });

        try {
            // Try Convex RAG semantic search first
            const convexResult = await convexClient.action(api.search.searchResources, {
                query,
                datasetId,
                format,
                limit,
            });

            if (convexResult.success && convexResult.count > 0) {
                // Convex RAG results don't have an apiUrl since they're from local vector DB
                return {
                    success: true,
                    count: convexResult.count,
                    source: 'convex-rag',
                    resources: convexResult.resources,
                };
            }

            // Fallback to CKAN API if Convex has no results
            const result = await dataGovApi.resource.search({
                query: ckanQuery,
                limit,
            });

            return {
                success: true,
                count: result.count,
                source: 'ckan-api',
                resources: result.results.map((r) => ({
                    id: r.id,
                    name: r.name,
                    url: r.url,
                    format: r.format,
                    description: r.description,
                    datasetId: r.package_id,
                })),
                apiUrl,
            };
        } catch (error) {
            // If Convex fails, try CKAN as fallback
            try {
                const result = await dataGovApi.resource.search({
                    query: ckanQuery,
                    limit,
                });

                return {
                    success: true,
                    count: result.count,
                    source: 'ckan-api-fallback',
                    resources: result.results.map((r) => ({
                        id: r.id,
                        name: r.name,
                        url: r.url,
                        format: r.format,
                        description: r.description,
                        datasetId: r.package_id,
                    })),
                    apiUrl,
                };
            } catch {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    apiUrl,
                };
            }
        }
    },
});
