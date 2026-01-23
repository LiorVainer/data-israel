/**
 * List Organizations Tool
 *
 * AI SDK tool for listing all organizations on data.gov.il
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const listOrganizations = tool({
  description:
    'Get a list of all organization names on data.gov.il. Use when user asks which government bodies or organizations publish data.',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const organizations = await dataGovApi.organization.list();

      return {
        success: true,
        count: organizations.length,
        organizations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
