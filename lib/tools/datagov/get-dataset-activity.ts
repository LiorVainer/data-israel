/**
 * Get Dataset Activity Tool
 *
 * AI SDK tool for retrieving activity stream of a dataset
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { buildDataGovUrl, DATAGOV_ENDPOINTS } from '@/lib/api/data-gov/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getDatasetActivityInputSchema = z.object({
    id: z.string().describe('Dataset ID or name'),
    offset: z.number().int().min(0).optional().describe('Pagination offset'),
    limit: z.number().int().min(1).max(100).optional().describe('Maximum number of activities to return'),
    searchedResourceName: z.string().describe('Hebrew title of the dataset. Shown in UI as badge label.'),
});

export const getDatasetActivityOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        activities: z.array(
            z.object({
                id: z.string(),
                timestamp: z.string(),
                activityType: z.string(),
                userId: z.string(),
            }),
        ),
        apiUrl: z.string().optional(),
        searchedResourceName: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional(),
        searchedResourceName: z.string(),
    }),
]);

export type GetDatasetActivityInput = z.infer<typeof getDatasetActivityInputSchema>;
export type GetDatasetActivityOutput = z.infer<typeof getDatasetActivityOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getDatasetActivity = tool({
    description:
        'Get the activity stream (change history) of a specific dataset. Use when user wants to know about updates, modifications, or history of a dataset.',
    inputSchema: getDatasetActivityInputSchema,
    execute: async ({ id, offset, limit, searchedResourceName }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.activityList, { id, offset, limit });

        try {
            const activities = await dataGovApi.dataset.activity(id, { offset, limit });

            return {
                success: true,
                activities: activities.map((a) => ({
                    id: a.id,
                    timestamp: a.timestamp,
                    activityType: a.activity_type,
                    userId: a.user_id,
                })),
                apiUrl,
                searchedResourceName,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
                searchedResourceName,
            };
        }
    },
});
