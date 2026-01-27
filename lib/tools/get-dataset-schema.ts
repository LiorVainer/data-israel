/**
 * Get Dataset Schema Tool
 *
 * AI SDK tool for retrieving the metadata schema for datasets
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getDatasetSchemaInputSchema = z.object({
    type: z.enum(['dataset', 'info']).optional().describe('Dataset type (default: "dataset")'),
});

export const getDatasetSchemaOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
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
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export type GetDatasetSchemaInput = z.infer<typeof getDatasetSchemaInputSchema>;
export type GetDatasetSchemaOutput = z.infer<typeof getDatasetSchemaOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getDatasetSchema = tool({
    description:
        'Get the metadata schema for a dataset type. Use when user asks about the structure or fields available in datasets.',
    inputSchema: getDatasetSchemaInputSchema,
    execute: async ({ type = 'dataset' }) => {
        try {
            const schema = await dataGovApi.system.schema(type);

            return {
                success: true,
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
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
