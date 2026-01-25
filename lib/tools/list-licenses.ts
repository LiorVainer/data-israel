/**
 * List Licenses Tool
 *
 * AI SDK tool for listing available dataset licenses
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const listLicensesInputSchema = z.object({});

export const listLicensesOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    licenses: z.array(z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      isOkdCompliant: z.boolean(),
      isOsiCompliant: z.boolean(),
    })),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type ListLicensesInput = z.infer<typeof listLicensesInputSchema>;
export type ListLicensesOutput = z.infer<typeof listLicensesOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listLicenses = tool({
  description:
    'Get the list of licenses available for datasets on data.gov.il. Use when user asks about data licenses or usage rights.',
  inputSchema: listLicensesInputSchema,
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
