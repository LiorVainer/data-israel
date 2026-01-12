/**
 * List Tags Tool
 *
 * AI SDK tool for listing all tags (keywords) used in datasets
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const listTags = tool({
  description:
    'List all tags (keywords) used in datasets. Use when user wants to explore available topics or search for tags.',
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe('Search query for tags (e.g., "health", "environment")'),
    allFields: z
      .boolean()
      .optional()
      .describe('Include full metadata for each tag'),
  }),
  execute: async ({ query, allFields }) => {
    try {
      const tags = await dataGovApi.tag.list({
        query,
        all_fields: allFields,
      });

      return {
        success: true,
        tags,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
