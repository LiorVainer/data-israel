/**
 * Browse CBS Catalog Tool
 *
 * AI SDK tool for browsing the CBS statistical catalog hierarchy
 */

import { tool } from 'ai';
import { z } from 'zod';
import { cbsApi } from '@/lib/api/cbs/client';
import { CBS_SERIES_PATHS, buildSeriesUrl } from '@/lib/api/cbs/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const browseCbsCatalogInputSchema = z.object({
    level: z
        .number()
        .int()
        .min(1)
        .max(5)
        .describe('Catalog hierarchy level (1=top categories, 2-5=deeper subcategories)'),
    subject: z
        .string()
        .optional()
        .describe('First-level category code (required for level 2+). Get from level 1 results.'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
    page: z.number().int().min(1).optional().describe('Page number (default 1)'),
    pageSize: z.number().int().min(1).max(1000).optional().describe('Items per page (default 100, max 1000)'),
});

export const browseCbsCatalogOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
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
        apiUrl: z.string().optional(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
        apiUrl: z.string().optional(),
    }),
]);

export type BrowseCbsCatalogInput = z.infer<typeof browseCbsCatalogInputSchema>;
export type BrowseCbsCatalogOutput = z.infer<typeof browseCbsCatalogOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const browseCbsCatalog = tool({
    description:
        'Browse the CBS (Central Bureau of Statistics) statistical catalog hierarchy. Start with level 1 to see top-level categories (e.g., population, economy, education), then drill into subcategories with higher levels. Use this to discover what statistical data series are available.',
    inputSchema: browseCbsCatalogInputSchema,
    execute: async ({ level, subject, language, page, pageSize }) => {
        // Construct API URL for reference
        const apiUrl = buildSeriesUrl(CBS_SERIES_PATHS.CATALOG_LEVEL, {
            id: level,
            subject,
            lang: language,
            page,
            pagesize: pageSize,
        });

        try {
            const result = await cbsApi.series.catalog({
                id: level,
                subject,
                lang: language,
                page,
                pagesize: pageSize,
            });

            const { catalogs } = result;

            return {
                success: true,
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
                success: false,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
            };
        }
    },
});
