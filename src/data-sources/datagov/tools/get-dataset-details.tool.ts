/**
 * Get Dataset Details Tool
 *
 * AI SDK tool for retrieving full metadata for a specific dataset
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { buildDataGovUrl, DATAGOV_ENDPOINTS, buildDatasetPortalUrl } from '../api/datagov.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getDatasetDetailsInputSchema = z.object({
    id: z.string().describe('Dataset ID or name'),
    ...commonToolInput,
});

export const getDatasetDetailsOutputSchema = toolOutputSchema({
    dataset: z.object({
        id: z.string(),
        title: z.string(),
        name: z.string(),
        organization: z.object({
            name: z.string(),
            title: z.string(),
        }),
        tags: z.array(z.unknown()),
        notes: z.string(),
        author: z.string(),
        maintainer: z.string(),
        license: z.string(),
        metadata_created: z.string(),
        metadata_modified: z.string(),
        /** Most recent last_modified among all resources — the actual data update date. */
        lastUpdated: z.string(),
        resources: z.array(
            z.object({
                id: z.string(),
                name: z.string(),
                url: z.string(),
                format: z.string(),
                description: z.string(),
                size: z.number(),
                created: z.string(),
                last_modified: z.string(),
            }),
        ),
    }),
});

export type GetDatasetDetailsInput = z.infer<typeof getDatasetDetailsInputSchema>;
export type GetDatasetDetailsOutput = z.infer<typeof getDatasetDetailsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getDatasetDetails = createTool({
    id: 'getDatasetDetails',
    description:
        'Get full details for a specific dataset by ID. Use when user wants detailed information about a dataset, including resources and metadata.',
    inputSchema: getDatasetDetailsInputSchema,
    execute: async ({ id }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.show, { id });

        try {
            const dataset = await dataGovApi.dataset.show(id);

            const resources = dataset.resources.slice(0, 20).map((r) => ({
                id: r.id,
                name: r.name,
                url: r.url,
                format: r.format,
                description: r.description,
                size: r.size,
                created: r.created,
                last_modified: r.last_modified,
            }));

            // The actual data update date is the most recent last_modified among resources.
            // metadata_modified only tracks CKAN form edits and is often stale.
            const resourceDates = resources.map((r) => r.last_modified).filter(Boolean) as string[];
            const lastUpdated =
                resourceDates.length > 0 ? resourceDates.reduce((a, b) => (a > b ? a : b)) : dataset.metadata_modified;

            return {
                success: true as const,
                dataset: {
                    id: dataset.id,
                    title: dataset.title,
                    name: dataset.name,
                    organization: {
                        name: dataset.organization.name,
                        title: dataset.organization.title,
                    },
                    tags: dataset.tags,
                    notes: dataset.notes,
                    author: dataset.author,
                    maintainer: dataset.maintainer,
                    license: dataset.license_title,
                    metadata_created: dataset.metadata_created,
                    metadata_modified: dataset.metadata_modified,
                    lastUpdated,
                    resources,
                },
                portalUrl: buildDatasetPortalUrl(dataset.organization.name, dataset.name),
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
// Source URL Resolver (custom — extracts dataset.title from nested output)
// ============================================================================

/** Co-located source URL resolver for getDatasetDetails */
export const resolveSourceUrl: ToolSourceResolver<GetDatasetDetailsInput, GetDatasetDetailsOutput> = (
    input,
    output,
) => {
    if (!output.success) return [];
    const portalUrl = output.portalUrl;
    if (!portalUrl) return [];
    const title = output.dataset.title || input.searchedResourceName;
    const name = output.dataset.name;
    return [{ url: portalUrl, title: title ?? name ?? 'מאגר מידע - data.gov.il', urlType: 'portal' }];
};
