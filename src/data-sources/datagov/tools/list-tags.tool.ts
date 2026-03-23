/**
 * List Tags Tool
 *
 * AI SDK tool for listing all tags (keywords) used in datasets
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '../api/datagov.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const listTagsInputSchema = z.object({
    query: z.string().optional().describe('Search query for tags (e.g., "health", "environment")'),
    allFields: z.boolean().optional().describe('Include full metadata for each tag'),
    ...commonToolInput,
});

export const listTagsOutputSchema = toolOutputSchema({
    tags: z.array(z.unknown()),
});

export type ListTagsInput = z.infer<typeof listTagsInputSchema>;
export type ListTagsOutput = z.infer<typeof listTagsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listTags = createTool({
    id: 'listTags',
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
