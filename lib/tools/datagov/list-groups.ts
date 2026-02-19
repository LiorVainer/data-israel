/**
 * List Groups Tool
 *
 * AI SDK tool for listing dataset publishers and categories (groups)
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '@/lib/api/data-gov/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const listGroupsInputSchema = z.object({
    orderBy: z.string().optional().describe('Field to order by (e.g., "name", "package_count")'),
    limit: z.number().int().min(1).max(100).optional().describe('Maximum number of results'),
    offset: z.number().int().min(0).optional().describe('Pagination offset'),
    allFields: z.boolean().optional().describe('Include full details for each group'),
    searchedResourceName: z
        .string()
        .describe('Hebrew label describing the list operation (e.g., "קבוצות נושאים"). Shown in UI as chip label.'),
});

export const listGroupsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        groups: z.array(z.unknown()),
        apiUrl: z.string().optional().describe('The API URL used to fetch the groups list'),
        searchedResourceName: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional().describe('The API URL that was attempted'),
        searchedResourceName: z.string(),
    }),
]);

export type ListGroupsInput = z.infer<typeof listGroupsInputSchema>;
export type ListGroupsOutput = z.infer<typeof listGroupsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listGroups = tool({
    description:
        'List dataset publishers and categories (groups). Use when user asks which organizations publish data or what categories are available.',
    inputSchema: listGroupsInputSchema,
    execute: async ({ orderBy, limit, offset, allFields, searchedResourceName }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.group.list, {
            order_by: orderBy,
            limit,
            offset,
            all_fields: allFields,
        });

        try {
            const groups = await dataGovApi.group.list({
                order_by: orderBy,
                limit,
                offset,
                all_fields: allFields,
            });

            return {
                success: true as const,
                groups,
                apiUrl,
                searchedResourceName,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
                searchedResourceName,
            };
        }
    },
});
