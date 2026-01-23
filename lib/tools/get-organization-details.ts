/**
 * Get Organization Details Tool
 *
 * AI SDK tool for retrieving details about a specific organization
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const getOrganizationDetails = tool({
  description:
    'Get detailed information about a specific organization. Use when user wants to know about a government body or organization that publishes data.',
  inputSchema: z.object({
    id: z.string().describe('Organization ID or name (short form)'),
  }),
  execute: async ({ id }) => {
    try {
      const org = await dataGovApi.organization.show(id);

      return {
        success: true,
        organization: {
          id: org.id,
          name: org.name,
          title: org.title,
          displayName: org.display_name,
          description: org.description,
          imageUrl: org.image_url,
          created: org.created,
          packageCount: org.package_count,
          state: org.state,
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
