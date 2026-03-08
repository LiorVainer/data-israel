/**
 * Get Organization Details Tool
 *
 * AI SDK tool for retrieving details about a specific organization
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { buildDataGovUrl, DATAGOV_ENDPOINTS } from '@/lib/api/data-gov/endpoints';
import { buildOrganizationPortalUrl } from '@/constants/datagov-urls';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getOrganizationDetailsInputSchema = z.object({
    id: z.string().describe('Organization ID or name (short form)'),
    searchedResourceName: z
        .string()
        .describe('Hebrew name of the organization. Shown in UI as badge label.'),
});

export const getOrganizationDetailsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        organization: z.object({
            id: z.string(),
            name: z.string(),
            title: z.string(),
            displayName: z.string(),
            description: z.string(),
            imageUrl: z.string(),
            created: z.string(),
            packageCount: z.number(),
            state: z.string(),
        }),
        portalUrl: z.string().describe('Portal URL for browsing this organization on data.gov.il'),
        apiUrl: z.string().optional().describe('The API URL used to fetch the organization details'),
        searchedResourceName: z.string().describe('Hebrew name of the organization for UI display'),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional().describe('The API URL that was attempted'),
        searchedResourceName: z.string().describe('Hebrew name of the organization for UI display'),
    }),
]);

export type GetOrganizationDetailsInput = z.infer<typeof getOrganizationDetailsInputSchema>;
export type GetOrganizationDetailsOutput = z.infer<typeof getOrganizationDetailsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getOrganizationDetails = tool({
    description:
        'Get detailed information about a specific organization. Use when user wants to know about a government body or organization that publishes data.',
    inputSchema: getOrganizationDetailsInputSchema,
    execute: async ({ id, searchedResourceName }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.organization.show, { id });

        try {
            const org = await dataGovApi.organization.show(id);

            return {
                success: true as const,
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
                portalUrl: buildOrganizationPortalUrl(org.name),
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
