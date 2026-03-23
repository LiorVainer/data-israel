/**
 * List Groups Tool
 *
 * AI SDK tool for listing dataset publishers and categories (groups)
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '../api/datagov.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const listGroupsInputSchema = z.object({
    orderBy: z.string().optional().describe('Field to order by (e.g., "name", "package_count")'),
    limit: z.number().int().min(1).max(100).optional().describe('Maximum number of results'),
    offset: z.number().int().min(0).optional().describe('Pagination offset'),
    allFields: z.boolean().optional().describe('Include full details for each group'),
    ...commonToolInput,
});

export const listGroupsOutputSchema = toolOutputSchema({
    groups: z.array(z.unknown()),
});

export type ListGroupsInput = z.infer<typeof listGroupsInputSchema>;
export type ListGroupsOutput = z.infer<typeof listGroupsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listGroups = createTool({
    id: 'listGroups',
    description:
        'List dataset publishers and categories (groups). Use when user asks which organizations publish data or what categories are available.',
    inputSchema: listGroupsInputSchema,
    execute: async ({ orderBy, limit, offset, allFields }) => {
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
