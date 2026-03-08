/**
 * List Organizations Tool
 *
 * AI SDK tool for listing all organizations on data.gov.il
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '@/lib/api/data-gov/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const listOrganizationsInputSchema = z.object({
    searchedResourceName: z
        .string()
        .describe('Hebrew label describing the list operation (e.g., "ארגונים"). Shown in UI as chip label.'),
});

export const listOrganizationsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        count: z.number(),
        organizations: z.array(z.string()),
        apiUrl: z.string().optional().describe('The API URL used to fetch the organizations list'),
        searchedResourceName: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional().describe('The API URL that was attempted'),
        searchedResourceName: z.string(),
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
    execute: async ({ searchedResourceName }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.organization.list);

        try {
            const organizations = await dataGovApi.organization.list();

            return {
                success: true as const,
                count: organizations.length,
                organizations,
                apiUrl,
                searchedResourceName,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
                searchedResourceName,
            };
        }
    },
});
