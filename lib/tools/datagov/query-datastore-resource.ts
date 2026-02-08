/**
 * Query DataStore Resource Tool
 *
 * AI SDK tool for querying tabular data within a DataStore resource
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';
import { buildDatastoreSearchUrl } from '@/lib/api/data-gov/endpoints';

// ============================================================================
// Schemas (Single Source of Truth)
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
    limit: z.number().int().min(1).max(1000).optional().describe('Number of records to return (default 100, max 1000)'),
    offset: z.number().int().min(0).optional().describe('Starting offset for pagination (default 0)'),
    sort: z.string().optional().describe('Sort order (e.g., "population desc" or "name asc")'),
    searchedResourceName: z
        .string()
        .describe('Hebrew name of the resource being queried. Shown in UI as badge label.'),
});

export const queryDatastoreResourceOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
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

export type QueryDatastoreResourceInput = z.infer<typeof queryDatastoreResourceInputSchema>;
export type QueryDatastoreResourceOutput = z.infer<typeof queryDatastoreResourceOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const queryDatastoreResource = tool({
    description:
        'Query tabular data within a DataStore resource. Use when user wants to see actual data rows, filter data by column values, or explore the contents of a resource. Supports pagination, filtering, sorting, and partial word search for Hebrew.',
    inputSchema: queryDatastoreResourceInputSchema,
    execute: async ({ resource_id, filters, q, partialMatch, limit = 100, offset = 0, sort, searchedResourceName }) => {
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
            const result = await dataGovApi.datastore.search({
                resource_id,
                filters,
                q: searchQuery,
                plain: partialMatch ? false : undefined,
                limit,
                offset,
                sort,
            });

            return {
                success: true,
                fields: result.fields.map((f) => ({
                    name: f.id,
                    type: f.type,
                })),
                records: result.records,
                total: result.total,
                limit,
                offset,
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
