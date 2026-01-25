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

export const searchResources = tool({
  description:
    'Search for resources (files) using semantic search. Use when user wants to find specific file types or resources across datasets.',
  inputSchema: z.object({
    query: z
      .string()
      .describe('Search query - can be natural language (e.g., "CSV files about schools", "education data")'),
    datasetId: z
      .string()
      .optional()
      .describe('Filter by dataset CKAN ID to search within a specific dataset'),
    format: z
      .string()
      .optional()
      .describe('Filter by file format (e.g., "csv", "json", "xlsx")'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of resources to return (default 10)'),
  }),
  execute: async ({ query, datasetId, format, limit = 10 }) => {
    try {
      // Try Convex RAG semantic search first
      const convexResult = await convexClient.action(api.search.searchResources, {
        query,
        datasetId,
        format,
        limit,
      });

      if (convexResult.success && convexResult.count > 0) {
        return {
          success: true,
          count: convexResult.count,
          source: 'convex-rag',
          resources: convexResult.resources,
        };
      }

      // Fallback to CKAN API if Convex has no results
      // Build CKAN query format
      const ckanQuery = format ? `format:${format}` : `name:${query}`;
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
      };
    } catch (error) {
      // If Convex fails, try CKAN as fallback
      try {
        const ckanQuery = format ? `format:${format}` : `name:${query}`;
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
