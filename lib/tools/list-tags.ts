/**
 * List Tags Tool
 *
 * AI SDK tool for listing all tags (keywords) used in datasets
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const listTagsInputSchema = z.object({
  query: z
    .string()
    .optional()
    .describe('Search query for tags (e.g., "health", "environment")'),
  allFields: z
    .boolean()
    .optional()
    .describe('Include full metadata for each tag'),
});

export const listTagsOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    tags: z.array(z.unknown()),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type ListTagsInput = z.infer<typeof listTagsInputSchema>;
export type ListTagsOutput = z.infer<typeof listTagsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listTags = tool({
  description:
    'List all tags (keywords) used in datasets. Use when user wants to explore available topics or search for tags.',
  inputSchema: listTagsInputSchema,
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
