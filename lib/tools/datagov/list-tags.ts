/**
 * List Tags Tool
 *
 * AI SDK tool for listing all tags (keywords) used in datasets
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '@/lib/api/data-gov/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const listTagsInputSchema = z.object({
    query: z.string().optional().describe('Search query for tags (e.g., "health", "environment")'),
    allFields: z.boolean().optional().describe('Include full metadata for each tag'),
});

export const listTagsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        tags: z.array(z.unknown()),
        apiUrl: z.string().optional().describe('The API URL used to fetch the tags list'),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional().describe('The API URL that was attempted'),
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
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.tag.list, {
            query,
            all_fields: allFields,
        });

        try {
            const tags = await dataGovApi.tag.list({
                query,
                all_fields: allFields,
            });

            return {
                success: true as const,
                tags,
                apiUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
            };
        }
    },
});
