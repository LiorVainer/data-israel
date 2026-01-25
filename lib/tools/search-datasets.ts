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

export const searchDatasets = tool({
  description:
    'Search for datasets on data.gov.il using semantic search. Use this when user asks about datasets related to a topic or keyword. Returns matching datasets ranked by relevance.',
  inputSchema: z.object({
    query: z
      .string()
      .describe('Search query - can be natural language (e.g., "health data", "transportation statistics")'),
    organization: z
      .string()
      .optional()
      .describe('Filter by organization ID'),
    tag: z
      .string()
      .optional()
      .describe('Filter by tag name'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Number of results to return (default 10)'),
  }),
  execute: async ({ query, organization, tag, limit = 10 }) => {
    try {
      // Try Convex RAG semantic search first
      const convexResult = await convexClient.action(api.search.searchDatasets, {
        query,
        organization,
        tag,
        limit,
      });

      if (convexResult.success && convexResult.count > 0) {
        return {
          success: true,
          count: convexResult.count,
          source: 'convex-rag',
          datasets: convexResult.datasets,
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
        };
      } catch {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  },
});
