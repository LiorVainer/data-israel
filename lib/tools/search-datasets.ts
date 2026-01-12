/**
 * Search Datasets Tool
 *
 * AI SDK tool for searching datasets on data.gov.il by keyword
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const searchDatasets = tool({
  description:
    'Search for datasets on data.gov.il. Use this when user asks about datasets related to a topic or keyword. Returns matching datasets with title, organization, and tags.',
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe('Search query keyword (e.g., "health", "transportation")'),
    sort: z
      .string()
      .optional()
      .describe('Sort order (e.g., "score desc, metadata_modified desc")'),
    rows: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Number of results to return (default 10)'),
    start: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Starting offset for pagination'),
  }),
  execute: async ({ query, sort, rows = 10, start = 0 }) => {
    try {
      const result = await dataGovApi.dataset.search({
        q: query,
        sort,
        rows,
        start,
      });

      return {
        success: true,
        count: result.count,
        datasets: result.results.map((d) => ({
          id: d.id,
          title: d.title,
          organization: d.organization?.title || 'Unknown',
          tags: d.tags.map((t) => t.name),
          summary: d.notes?.slice(0, 200) || '',
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
