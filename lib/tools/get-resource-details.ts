/**
 * Get Resource Details Tool
 *
 * AI SDK tool for retrieving metadata about a specific resource
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const getResourceDetails = tool({
  description:
    'Get detailed metadata for a specific resource (file). Use when user wants full information about a downloadable resource.',
  inputSchema: z.object({
    id: z.string().describe('Resource ID'),
    includeTracking: z
      .boolean()
      .optional()
      .describe('Include usage/tracking information'),
  }),
  execute: async ({ id, includeTracking = false }) => {
    try {
      const resource = await dataGovApi.resource.show(id, includeTracking);

      return {
        success: true,
        resource: {
          id: resource.id,
          name: resource.name,
          url: resource.url,
          format: resource.format,
          description: resource.description,
          mimetype: resource.mimetype,
          size: resource.size,
          hash: resource.hash,
          created: resource.created,
          lastModified: resource.last_modified,
          packageId: resource.package_id,
          state: resource.state,
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
