/**
 * Get Health Data Tool
 *
 * Fetch actual data from a specific health dashboard endpoint.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { healthApi } from '../../api/overview-data/overview-data.client';
import { buildHealthDataUrl } from '../../api/overview-data/overview-data.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/**
 * Recursively clean whitespace from string values in JSON data.
 * Matches the behavior of the original ILHealth MCP server.
 */
function cleanJsonStrings(data: unknown): unknown {
    if (typeof data === 'string') {
        return data.replace(/\s+/g, ' ').trim();
    }
    if (Array.isArray(data)) {
        return data.map(cleanJsonStrings);
    }
    if (isRecord(data)) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = cleanJsonStrings(value);
        }
        return result;
    }
    return data;
}

// ============================================================================
// Schemas
// ============================================================================

export const getHealthDataInputSchema = z.object({
    endPointName: z.string().describe('Endpoint name from getHealthMetadata results'),
    ...commonToolInput,
});

export const getHealthDataOutputSchema = toolOutputSchema({
    data: z.unknown().describe('The data payload from the endpoint'),
    recordCount: z.number().describe('Number of top-level records (if array) or keys'),
    endPointName: z.string(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getHealthData = createTool({
    id: 'getHealthData',
    description:
        'Fetch actual data from a specific health dashboard endpoint. Use getHealthMetadata first to discover available endpoint names for a subject.',
    inputSchema: getHealthDataInputSchema,
    outputSchema: getHealthDataOutputSchema,
    execute: async ({ endPointName }) => {
        const apiUrl = buildHealthDataUrl(endPointName);

        try {
            const rawData = await healthApi.getData(endPointName);
            const data = cleanJsonStrings(rawData);

            const recordCount = Array.isArray(data) ? data.length : isRecord(data) ? Object.keys(data).length : 1;

            return {
                success: true as const,
                data,
                recordCount,
                endPointName,
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
