/**
 * Get Dataset Activity Tool
 *
 * AI SDK tool for retrieving activity stream of a dataset
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { buildDataGovUrl, DATAGOV_ENDPOINTS } from '../api/datagov.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getDatasetActivityInputSchema = z.object({
    id: z.string().describe('Dataset ID or name'),
    offset: z.number().int().min(0).optional().describe('Pagination offset'),
    limit: z.number().int().min(1).max(100).optional().describe('Maximum number of activities to return'),
    ...commonToolInput,
});

export const getDatasetActivityOutputSchema = toolOutputSchema({
    activities: z.array(
        z.object({
            id: z.string(),
            timestamp: z.string(),
            activityType: z.string(),
            userId: z.string(),
        }),
    ),
});

export type GetDatasetActivityInput = z.infer<typeof getDatasetActivityInputSchema>;
export type GetDatasetActivityOutput = z.infer<typeof getDatasetActivityOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getDatasetActivity = createTool({
    id: 'getDatasetActivity',
    description:
        'Get the activity stream (change history) of a specific dataset. Use when user wants to know about updates, modifications, or history of a dataset.',
    inputSchema: getDatasetActivityInputSchema,
    execute: async ({ id, offset, limit }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.activityList, { id, offset, limit });

        try {
            const activities = await dataGovApi.dataset.activity(id, { offset, limit });

            return {
                success: true as const,
                activities: activities.map((a) => ({
                    id: a.id,
                    timestamp: a.timestamp,
                    activityType: a.activity_type,
                    userId: a.user_id,
                })),
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
