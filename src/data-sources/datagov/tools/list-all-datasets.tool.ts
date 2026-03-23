/**
 * List All Datasets Tool
 *
 * AI SDK tool for getting all dataset IDs on data.gov.il
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '../api/datagov.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const listAllDatasetsInputSchema = z.object({
    ...commonToolInput,
});

export const listAllDatasetsOutputSchema = toolOutputSchema({
    count: z.number(),
    datasetIds: z.array(z.string()),
});

export type ListAllDatasetsInput = z.infer<typeof listAllDatasetsInputSchema>;
export type ListAllDatasetsOutput = z.infer<typeof listAllDatasetsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listAllDatasets = createTool({
    id: 'listAllDatasets',
    description:
        'Get a list of all dataset IDs (names) available on data.gov.il. Use when user needs a complete list of datasets or wants to know the total count.',
    inputSchema: listAllDatasetsInputSchema,
    execute: async () => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.list);

        try {
            const datasetIds = await dataGovApi.dataset.list();

            return {
                success: true as const,
                count: datasetIds.length,
                datasetIds,
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
