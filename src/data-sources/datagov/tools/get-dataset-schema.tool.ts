/**
 * Get Dataset Schema Tool
 *
 * AI SDK tool for retrieving the metadata schema for datasets
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '../api/datagov.endpoints';
import { toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getDatasetSchemaInputSchema = z.object({
    type: z.enum(['dataset', 'info']).optional().describe('Dataset type (default: "dataset")'),
});

export const getDatasetSchemaOutputSchema = toolOutputSchema({
    schema: z.object({
        schemaVersion: z.number(),
        datasetType: z.string(),
        about: z.string(),
        aboutUrl: z.string(),
        datasetFields: z
            .array(
                z.object({
                    fieldName: z.string(),
                    label: z.string(),
                    required: z.boolean(),
                    helpText: z.string(),
                }),
            )
            .optional(),
        resourceFields: z
            .array(
                z.object({
                    fieldName: z.string(),
                    label: z.string(),
                    required: z.boolean(),
                    helpText: z.string(),
                }),
            )
            .optional(),
    }),
});

export type GetDatasetSchemaInput = z.infer<typeof getDatasetSchemaInputSchema>;
export type GetDatasetSchemaOutput = z.infer<typeof getDatasetSchemaOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getDatasetSchema = createTool({
    id: 'getDatasetSchema',
    description:
        'Get the metadata schema for a dataset type. Use when user asks about the structure or fields available in datasets.',
    inputSchema: getDatasetSchemaInputSchema,
    execute: async ({ type = 'dataset' }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.system.schemingDatasetSchemaShow, { type });

        try {
            const schema = await dataGovApi.system.schema(type);

            return {
                success: true as const,
                schema: {
                    schemaVersion: schema.scheming_version,
                    datasetType: schema.dataset_type,
                    about: schema.about,
                    aboutUrl: schema.about_url,
                    datasetFields: schema.dataset_fields?.map((f) => ({
                        fieldName: f.field_name,
                        label: f.label,
                        required: f.required,
                        helpText: f.help_text,
                    })),
                    resourceFields: schema.resource_fields?.map((f) => ({
                        fieldName: f.field_name,
                        label: f.label,
                        required: f.required,
                        helpText: f.help_text,
                    })),
                },
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
