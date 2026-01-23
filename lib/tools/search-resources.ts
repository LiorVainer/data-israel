/**
 * Search Resources Tool
 *
 * AI SDK tool for searching resources (files) on data.gov.il
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const searchResources = tool({
  description:
    'Search for resources (files) based on their field values. Use when user wants to find specific file types or resources across datasets. For better performance, use searchDatasets instead.',
  inputSchema: z.object({
    query: z
      .string()
      .describe('Search criteria in format "field:term" (e.g., "format:csv", "name:data")'),
    orderBy: z
      .string()
      .optional()
      .describe('Field to order results by'),
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Pagination offset'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of resources to return'),
  }),
  execute: async ({ query, orderBy, offset, limit }) => {
    try {
      const result = await dataGovApi.resource.search({
        query,
        order_by: orderBy,
        offset,
        limit,
      });

      return {
        success: true,
        count: result.count,
        resources: result.results.map((r) => ({
          id: r.id,
          name: r.name,
          url: r.url,
          format: r.format,
          description: r.description,
          packageId: r.package_id,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
