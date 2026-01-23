/**
 * Get Dataset Schema Tool
 *
 * AI SDK tool for retrieving the metadata schema for datasets
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const getDatasetSchema = tool({
  description:
    'Get the metadata schema for a dataset type. Use when user asks about the structure or fields available in datasets.',
  inputSchema: z.object({
    type: z
      .enum(['dataset', 'info'])
      .optional()
      .describe('Dataset type (default: "dataset")'),
  }),
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
