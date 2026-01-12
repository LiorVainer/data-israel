/**
 * Get Dataset Details Tool
 *
 * AI SDK tool for retrieving full metadata for a specific dataset
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const getDatasetDetails = tool({
  description:
    'Get full details for a specific dataset by ID. Use when user wants detailed information about a dataset, including resources and metadata.',
  inputSchema: z.object({
    id: z.string().describe('Dataset ID or name'),
  }),
  execute: async ({ id }) => {
    try {
      const dataset = await dataGovApi.dataset.show(id);

      return {
        success: true,
        dataset: {
          id: dataset.id,
          title: dataset.title,
          name: dataset.name,
          organization: dataset.organization,
          tags: dataset.tags,
          notes: dataset.notes,
          author: dataset.author,
          maintainer: dataset.maintainer,
          license: dataset.license_title,
          metadata_created: dataset.metadata_created,
          metadata_modified: dataset.metadata_modified,
          resources: dataset.resources.map((r) => ({
            id: r.id,
            name: r.name,
            url: r.url,
            format: r.format,
            description: r.description,
            size: r.size,
            created: r.created,
            last_modified: r.last_modified,
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
