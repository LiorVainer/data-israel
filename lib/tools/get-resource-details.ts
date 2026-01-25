/**
 * Get Resource Details Tool
 *
 * AI SDK tool for retrieving metadata about a specific resource
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getResourceDetailsInputSchema = z.object({
  id: z.string().describe('Resource ID'),
  includeTracking: z
    .boolean()
    .optional()
    .describe('Include usage/tracking information'),
});

export const getResourceDetailsOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    resource: z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      format: z.string(),
      description: z.string(),
      mimetype: z.string(),
      size: z.number(),
      hash: z.string(),
      created: z.string(),
      lastModified: z.string(),
      packageId: z.string(),
      state: z.string(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type GetResourceDetailsInput = z.infer<typeof getResourceDetailsInputSchema>;
export type GetResourceDetailsOutput = z.infer<typeof getResourceDetailsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getResourceDetails = tool({
  description:
    'Get detailed metadata for a specific resource (file). Use when user wants full information about a downloadable resource.',
  inputSchema: getResourceDetailsInputSchema,
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
