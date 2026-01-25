/**
 * Get Status Tool
 *
 * AI SDK tool for retrieving CKAN system status and version information
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getStatusInputSchema = z.object({});

export const getStatusOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    status: z.object({
      ckanVersion: z.string(),
      siteTitle: z.string(),
      siteDescription: z.string(),
      siteUrl: z.string(),
      extensions: z.array(z.string()),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type GetStatusInput = z.infer<typeof getStatusInputSchema>;
export type GetStatusOutput = z.infer<typeof getStatusOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getStatus = tool({
  description:
    'Get the CKAN version and list of installed extensions. Use when user asks about the data portal capabilities or system information.',
  inputSchema: getStatusInputSchema,
  execute: async () => {
    try {
      const status = await dataGovApi.system.status();

      return {
        success: true,
        status: {
          ckanVersion: status.ckan_version,
          siteTitle: status.site_title,
          siteDescription: status.site_description,
          siteUrl: status.site_url,
          extensions: status.extensions,
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
