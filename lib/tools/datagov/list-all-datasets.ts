/**
 * List All Datasets Tool
 *
 * AI SDK tool for getting all dataset IDs on data.gov.il
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '@/lib/api/data-gov/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const listAllDatasetsInputSchema = z.object({});

export const listAllDatasetsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        count: z.number(),
        datasetIds: z.array(z.string()),
        apiUrl: z.string().optional(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional(),
    }),
]);

export type ListAllDatasetsInput = z.infer<typeof listAllDatasetsInputSchema>;
export type ListAllDatasetsOutput = z.infer<typeof listAllDatasetsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listAllDatasets = tool({
    description:
        'Get a list of all dataset IDs (names) available on data.gov.il. Use when user needs a complete list of datasets or wants to know the total count.',
    inputSchema: listAllDatasetsInputSchema,
    execute: async () => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.list);

        try {
            const datasetIds = await dataGovApi.dataset.list();

            return {
                success: true,
                count: datasetIds.length,
                datasetIds,
                apiUrl,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
            };
        }
    },
});
