/**
 * List Organizations Tool
 *
 * AI SDK tool for listing all organizations on data.gov.il
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const listOrganizationsInputSchema = z.object({});

export const listOrganizationsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        count: z.number(),
        organizations: z.array(z.string()),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export type ListOrganizationsInput = z.infer<typeof listOrganizationsInputSchema>;
export type ListOrganizationsOutput = z.infer<typeof listOrganizationsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listOrganizations = tool({
    description:
        'Get a list of all organization names on data.gov.il. Use when user asks which government bodies or organizations publish data.',
    inputSchema: listOrganizationsInputSchema,
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
