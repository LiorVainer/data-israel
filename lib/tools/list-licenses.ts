/**
 * List Licenses Tool
 *
 * AI SDK tool for listing available dataset licenses
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const listLicenses = tool({
  description:
    'Get the list of licenses available for datasets on data.gov.il. Use when user asks about data licenses or usage rights.',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const licenses = await dataGovApi.system.licenses();

      return {
        success: true,
        licenses: licenses.map((l) => ({
          id: l.id,
          title: l.title,
          url: l.url,
          isOkdCompliant: l.is_okd_compliant,
          isOsiCompliant: l.is_osi_compliant,
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
