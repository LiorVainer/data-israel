/**
 * Get Organization Details Tool
 *
 * AI SDK tool for retrieving details about a specific organization
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { buildDataGovUrl, DATAGOV_ENDPOINTS, buildOrganizationPortalUrl } from '../api/datagov.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getOrganizationDetailsInputSchema = z.object({
    id: z.string().describe('Organization ID or name (short form)'),
    ...commonToolInput,
});

export const getOrganizationDetailsOutputSchema = toolOutputSchema({
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
});

export type GetOrganizationDetailsInput = z.infer<typeof getOrganizationDetailsInputSchema>;
export type GetOrganizationDetailsOutput = z.infer<typeof getOrganizationDetailsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getOrganizationDetails = createTool({
    id: 'getOrganizationDetails',
    description:
        'Get detailed information about a specific organization. Use when user wants to know about a government body or organization that publishes data.',
    inputSchema: getOrganizationDetailsInputSchema,
    execute: async ({ id }) => {
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
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
            };
        }
    },
});

// ============================================================================
// Source URL Resolver (custom — extracts organization.title from nested output)
// ============================================================================

/** Co-located source URL resolver for getOrganizationDetails */
// fallow-ignore-next-line duplicate-exports
export const resolveSourceUrl: ToolSourceResolver<GetOrganizationDetailsInput, GetOrganizationDetailsOutput> = (
    input,
    output,
) => {
    if (!output.success) return [];
    const portalUrl = output.portalUrl;
    if (!portalUrl) return [];
    const title = output.organization.title || input.searchedResourceName;
    const name = output.organization.name;
    return [{ url: portalUrl, title: title ?? name ?? 'ארגון - data.gov.il', urlType: 'portal' }];
};
