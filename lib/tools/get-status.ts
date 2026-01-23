/**
 * Get Status Tool
 *
 * AI SDK tool for retrieving CKAN system status and version information
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const getStatus = tool({
  description:
    'Get the CKAN version and list of installed extensions. Use when user asks about the data portal capabilities or system information.',
  inputSchema: z.object({}),
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
