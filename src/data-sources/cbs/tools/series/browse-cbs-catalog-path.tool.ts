/**
 * Browse CBS Catalog by Path Tool
 *
 * AI SDK tool for browsing the CBS statistical catalog using a specific hierarchical path
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { cbsApi } from '../../api/cbs.client';
import { CBS_SERIES_PATHS, buildSeriesUrl } from '../../api/cbs.endpoints';
import { toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const browseCbsCatalogPathInputSchema = z.object({
    path: z
        .string()
        .describe(
            'Comma-separated path codes for the catalog hierarchy (e.g., "2,1,1,2,379"). Get path values from browse-cbs-catalog results.',
        ),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
    page: z.number().int().min(1).optional().describe('Page number (default 1)'),
    pageSize: z.number().int().min(1).max(1000).optional().describe('Items per page (default 100, max 1000)'),
});

export const browseCbsCatalogPathOutputSchema = toolOutputSchema({
    level: z.number(),
    items: z.array(
        z.object({
            path: z.array(z.number()),
            name: z.string(),
            pathDesc: z.string().nullable(),
        }),
    ),
    totalItems: z.number(),
    currentPage: z.number(),
    lastPage: z.number(),
});

export type BrowseCbsCatalogPathInput = z.infer<typeof browseCbsCatalogPathInputSchema>;
export type BrowseCbsCatalogPathOutput = z.infer<typeof browseCbsCatalogPathOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const browseCbsCatalogPath = createTool({
    id: 'browseCbsCatalogPath',
    description:
        'Browse the CBS catalog by a specific hierarchical path (e.g., "2,1,1,2,379"). Use this after discovering categories with browse-cbs-catalog to navigate directly to a known location in the catalog tree.',
    inputSchema: browseCbsCatalogPathInputSchema,
    outputSchema: browseCbsCatalogPathOutputSchema,
    execute: async ({ path, language, page, pageSize }) => {
        // Construct API URL for reference
        const apiUrl = buildSeriesUrl(CBS_SERIES_PATHS.CATALOG_PATH, {
            id: path,
            lang: language,
            page,
            pagesize: pageSize,
        });

        try {
            const result = await cbsApi.series.catalogByPath({
                id: path,
                lang: language,
                page,
                pagesize: pageSize,
            });

            const { catalogs } = result;

            if (!catalogs?.catalog?.length) {
                return {
                    success: false as const,
                    error: 'No catalog entries found for this path. Try a different path or drill into a parent category.',
                    apiUrl,
                };
            }

            return {
                success: true as const,
                level: catalogs.level,
                items: catalogs.catalog.map((item) => ({
                    path: item.path,
                    name: item.name,
                    pathDesc: item.pathDesc,
                })),
                totalItems: catalogs.paging.total_items,
                currentPage: catalogs.paging.current_page,
                lastPage: catalogs.paging.last_page,
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
