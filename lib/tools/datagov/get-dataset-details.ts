/**
 * Get Dataset Details Tool
 *
 * AI SDK tool for retrieving full metadata for a specific dataset
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { buildDataGovUrl, DATAGOV_ENDPOINTS } from '@/lib/api/data-gov/endpoints';
import { buildDatasetPortalUrl } from '@/constants/datagov-urls';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getDatasetDetailsInputSchema = z.object({
    id: z.string().describe('Dataset ID or name'),
    searchedResourceName: z
        .string()
        .describe('Hebrew title of the dataset (from search). Shown in UI as badge label.'),
});

export const getDatasetDetailsOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
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
        portalUrl: z.string(),
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

export type GetDatasetDetailsInput = z.infer<typeof getDatasetDetailsInputSchema>;
export type GetDatasetDetailsOutput = z.infer<typeof getDatasetDetailsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getDatasetDetails = tool({
    description:
        'Get full details for a specific dataset by ID. Use when user wants detailed information about a dataset, including resources and metadata.',
    inputSchema: getDatasetDetailsInputSchema,
    execute: async ({ id, searchedResourceName }) => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.show, { id });

        try {
            const dataset = await dataGovApi.dataset.show(id);

            const resources = dataset.resources.map((r) => ({
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
                success: true,
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
