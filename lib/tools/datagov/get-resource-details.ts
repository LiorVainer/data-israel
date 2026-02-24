/**
 * Get Resource Details Tool
 *
 * AI SDK tool for retrieving metadata about a specific resource
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { buildDataGovUrl, DATAGOV_ENDPOINTS } from '@/lib/api/data-gov/endpoints';
import { buildResourcePortalUrl } from '@/constants/datagov-urls';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getResourceDetailsInputSchema = z.object({
    id: z.string().describe('Resource ID'),
    includeTracking: z.boolean().optional().describe('Include usage/tracking information'),
    searchedResourceName: z
        .string()
        .describe('Hebrew name of the resource (from search). Shown in UI as badge label.'),
});

export const getResourceDetailsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        resource: z.object({
            id: z.string(),
            name: z.string(),
            url: z.string(),
            format: z.string(),
            description: z.string(),
            mimetype: z.string(),
            size: z.number(),
            hash: z.string(),
            created: z.string(),
            lastModified: z.string(),
            packageId: z.string(),
            state: z.string(),
        }),
        portalUrl: z.string().optional().describe('Portal URL for browsing this resource on data.gov.il'),
        apiUrl: z.string().optional(),
        searchedResourceName: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional(),
        searchedResourceName: z.string(),
    }),
]);

export type GetResourceDetailsInput = z.infer<typeof getResourceDetailsInputSchema>;
export type GetResourceDetailsOutput = z.infer<typeof getResourceDetailsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getResourceDetails = tool({
    description:
        'Get detailed metadata for a specific resource (file). Use when user wants full information about a downloadable resource.',
    inputSchema: getResourceDetailsInputSchema,
    execute: async ({ id, includeTracking = false, searchedResourceName }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.resource.show, {
            id,
            include_tracking: includeTracking || undefined,
        });

        try {
            const resource = await dataGovApi.resource.show(id, includeTracking);

            // Fetch parent dataset to build portal URL
            let portalUrl: string | undefined;
            if (resource.package_id) {
                try {
                    const dataset = await dataGovApi.dataset.show(resource.package_id);
                    portalUrl = buildResourcePortalUrl(
                        dataset.organization.name,
                        dataset.name,
                        resource.id,
                    );
                } catch {
                    // Non-critical: portal URL is optional
                }
            }

            return {
                success: true,
                resource: {
                    id: resource.id,
                    name: resource.name,
                    url: resource.url,
                    format: resource.format,
                    description: resource.description,
                    mimetype: resource.mimetype,
                    size: resource.size,
                    hash: resource.hash,
                    created: resource.created,
                    lastModified: resource.last_modified,
                    packageId: resource.package_id,
                    state: resource.state,
                },
                portalUrl,
                apiUrl,
                searchedResourceName,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
                searchedResourceName,
            };
        }
    },
});
