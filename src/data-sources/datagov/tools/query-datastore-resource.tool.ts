/**
 * Query DataStore Resource Tool
 *
 * AI SDK tool for querying tabular data within a DataStore resource
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { buildDatastoreSearchUrl } from '../api/datagov.endpoints';
import { convexClient, api } from '@/lib/convex/client';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

/** Maximum number of field definitions to include in output */
const QUERY_MAX_FIELDS = 30;

// ============================================================================
// Schemas
// ============================================================================

export const queryDatastoreResourceInputSchema = z.object({
    resource_id: z.string().describe('The ID of the resource to query (from dataset resources list)'),
    filters: z
        .record(z.string(), z.union([z.string(), z.number()]))
        .optional()
        .describe(
            'Filter records by column values (e.g., {"city": "Jerusalem", "year": 2023}), Better for exact matches',
        ),
    q: z.string().optional().describe('Full-text search query across all fields'),
    partialMatch: z
        .boolean()
        .optional()
        .describe(
            'Enable partial/prefix matching for Hebrew text search. When true, searches for words starting with the query (e.g., "ירו" matches "ירושלים"). Useful for Hebrew autocomplete.',
        ),
    limit: z.number().int().min(1).max(50).optional().describe('Number of records to return (default 20, max 50)'),
    offset: z.number().int().min(0).optional().describe('Starting offset for pagination (default 0)'),
    sort: z.string().optional().describe('Sort order (e.g., "population desc" or "name asc")'),
    ...commonToolInput,
});

export const queryDatastoreResourceOutputSchema = toolOutputSchema({
    /** Dataset description (Hebrew) explaining what the fields mean — use this to interpret field names */
    datasetDescription: z.string().optional(),
    fields: z.array(
        z.object({
            name: z.string(),
            type: z.string(),
        }),
    ),
    records: z.array(z.unknown()),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
});

export type QueryDatastoreResourceInput = z.infer<typeof queryDatastoreResourceInputSchema>;
export type QueryDatastoreResourceOutput = z.infer<typeof queryDatastoreResourceOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const queryDatastoreResource = createTool({
    id: 'queryDatastoreResource',
    description:
        'Query tabular data within a DataStore resource. Use when user wants to see actual data rows, filter data by column values, or explore the contents of a resource. Supports pagination, filtering, sorting, and partial word search for Hebrew.',
    inputSchema: queryDatastoreResourceInputSchema,
    execute: async ({ resource_id, filters, q, partialMatch, limit = 20, offset = 0, sort }) => {
        // Format query for partial matching if enabled
        const searchQuery = q && partialMatch ? `${q}:*` : q;

        const apiUrl = buildDatastoreSearchUrl({
            resource_id,
            filters,
            q: searchQuery,
            plain: partialMatch ? false : undefined,
            limit,
            offset,
            sort,
        });

        try {
            // Fetch data and dataset description in parallel
            const [result, resourceDoc] = await Promise.all([
                dataGovApi.datastore.search({
                    resource_id,
                    filters,
                    q: searchQuery,
                    plain: partialMatch ? false : undefined,
                    limit,
                    offset,
                    sort,
                }),
                convexClient.query(api.resources.getByCkanId, { ckanId: resource_id }).catch(() => null),
            ]);

            // Lookup dataset notes (explains field names in Hebrew) — single lightweight query
            let datasetDescription: string | undefined;
            if (resourceDoc?.datasetCkanId) {
                const dataset = await convexClient
                    .query(api.datasets.getByCkanId, { ckanId: resourceDoc.datasetCkanId })
                    .catch(() => null);
                datasetDescription = dataset?.notes?.slice(0, 500) ?? undefined;
            }

            return {
                success: true as const,
                datasetDescription,
                fields: result.fields.slice(0, QUERY_MAX_FIELDS).map((f) => ({
                    name: f.id,
                    type: f.type,
                })),
                records: result.records,
                total: result.total,
                limit,
                offset,
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

/** Co-located source URL resolver for queryDatastoreResource */
export const resolveSourceUrl: ToolSourceResolver = (input, output) => {
    if (!isRecord(output) || output.success !== true) return null;
    const apiUrl = getString(output, 'apiUrl');
    if (!apiUrl) return null;
    const resourceName = getString(input, 'searchedResourceName');
    const query = getString(input, 'q');
    let title = resourceName ? `שאילתת נתונים — ${resourceName}` : 'שאילתת נתונים';
    if (query) title += ` (${query})`;
    return { url: apiUrl, title, urlType: 'api' };
};
