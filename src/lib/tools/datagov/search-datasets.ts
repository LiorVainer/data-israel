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
        .describe('Search query — use 1-2 short keywords for best results (e.g., "רכבת", "חינוך", "תחבורה"). Avoid long phrases.'),
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

/** Minimum RAG score to consider a result relevant */
const RAG_MIN_SCORE = 0.5;

/** Search CKAN API and return formatted results */
async function searchCkan(query: string, limit: number) {
    const result = await dataGovApi.dataset.search({
        q: query,
        rows: limit,
        start: 0,
    });
    return {
        count: result.count,
        datasets: result.results.map((d) => ({
            id: d.id,
            title: d.title,
            organization: d.organization?.title || 'Unknown',
            tags: d.tags.map((t) => t.name),
            summary: d.notes?.slice(0, 200) || '',
        })),
    };
}

export const searchDatasets = tool({
    description:
        'Search for datasets on data.gov.il. Use short 1-2 keyword queries for best results (e.g., "רכבת" not "נתוני דיוק רכבת ישראל"). Returns matching datasets ranked by relevance.',
    inputSchema: searchDatasetsInputSchema,
    execute: async ({ query, organization, tag, limit = 10, searchedResourceName }) => {
        // Build CKAN API URL for reference
        const ckanApiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.search, {
            q: query,
            rows: limit,
            start: 0,
        });

        // Run RAG and CKAN in parallel — merge the best results from both
        const [ragResult, ckanResult] = await Promise.allSettled([
            convexClient.action(api.search.searchDatasets, {
                query,
                organization,
                tag,
                limit,
            }),
            searchCkan(query, limit),
        ]);

        // Collect RAG results (only those above minimum score)
        const ragDatasets =
            ragResult.status === 'fulfilled' && ragResult.value.success
                ? ragResult.value.datasets.filter(
                      (d: { score?: number }) => (d.score ?? 0) >= RAG_MIN_SCORE,
                  )
                : [];

        // Collect CKAN results
        const ckanDatasets =
            ckanResult.status === 'fulfilled' ? ckanResult.value.datasets : [];

        // Merge: deduplicate by dataset ID, preferring CKAN (more complete data)
        const seenIds = new Set<string>();
        const merged: Array<{
            id: string;
            title: string;
            organization: string;
            tags: string[];
            summary: string;
        }> = [];

        // CKAN results first (they have tags + summary, and ranking is better for keyword matches)
        for (const d of ckanDatasets) {
            if (!seenIds.has(d.id)) {
                seenIds.add(d.id);
                merged.push(d);
            }
        }

        // Then RAG results that weren't in CKAN
        for (const d of ragDatasets) {
            const id = (d as { id?: string }).id ?? '';
            if (id && !seenIds.has(id)) {
                seenIds.add(id);
                merged.push({
                    id,
                    title: (d as { title?: string }).title ?? '',
                    organization: (d as { organization?: string }).organization ?? 'Unknown',
                    tags: [],
                    summary: (d as { matchedText?: string }).matchedText ?? '',
                });
            }
        }

        const finalDatasets = merged.slice(0, limit);

        if (finalDatasets.length > 0) {
            const source =
                ckanDatasets.length > 0 && ragDatasets.length > 0
                    ? 'ckan-api'
                    : ckanDatasets.length > 0
                      ? 'ckan-api'
                      : 'convex-rag';

            return {
                success: true,
                count: finalDatasets.length,
                source,
                datasets: finalDatasets,
                apiUrl: ckanApiUrl,
                searchedResourceName,
            } as const;
        }

        return {
            success: false,
            error: 'No datasets found for query',
            apiUrl: ckanApiUrl,
            searchedResourceName,
        } as const;
    },
});
