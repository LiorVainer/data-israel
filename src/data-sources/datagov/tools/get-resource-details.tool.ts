/**
 * Get Resource Details Tool
 *
 * AI SDK tool for retrieving metadata about a specific resource
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { buildDataGovUrl, DATAGOV_ENDPOINTS, buildResourcePortalUrl } from '../api/datagov.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getResourceDetailsInputSchema = z.object({
    id: z.string().describe('Resource ID'),
    includeTracking: z.boolean().optional().describe('Include usage/tracking information'),
    ...commonToolInput,
});

export const getResourceDetailsOutputSchema = toolOutputSchema({
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
});

export type GetResourceDetailsInput = z.infer<typeof getResourceDetailsInputSchema>;
export type GetResourceDetailsOutput = z.infer<typeof getResourceDetailsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getResourceDetails = createTool({
    id: 'getResourceDetails',
    description:
        'Get detailed metadata for a specific resource (file). Use when user wants full information about a downloadable resource.',
    inputSchema: getResourceDetailsInputSchema,
    execute: async ({ id, includeTracking = false }) => {
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
                success: true as const,
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
// Source URL Resolver
// ============================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
}

/** Co-located source URL resolver for getResourceDetails */
export const resolveSourceUrl: ToolSourceResolver = (input, output) => {
    if (!isRecord(output) || output.success !== true) return null;
    const portalUrl = getString(output, 'portalUrl');
    const apiUrl = getString(output, 'apiUrl');
    const url = portalUrl ?? apiUrl;
    if (!url) return null;
    const resourceName = getString(input, 'searchedResourceName');
    const resource = isRecord(output) ? output.resource : undefined;
    const name = getString(resource, 'name');
    return {
        url,
        title: resourceName ?? name ?? 'פרטי משאב - data.gov.il',
        urlType: portalUrl ? 'portal' : 'api',
    };
};
