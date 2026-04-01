/**
 * Generate Nadlan Source URL Tool
 *
 * Generates a clickable Govmap source URL so users can view
 * real estate data directly on the Govmap portal.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildGovmapPortalUrl } from '../../api/nadlan/nadlan.endpoints';

export const generateNadlanSourceUrlInputSchema = z.object({
    longitude: z.number().optional().describe('ITM X coordinate for map centering'),
    latitude: z.number().optional().describe('ITM Y coordinate for map centering'),
    title: z.string().describe('Hebrew display title for the source link'),
    query: z.string().optional().describe('Search query for the govmap portal (e.g. address or neighborhood name)'),
});

export const generateNadlanSourceUrlOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        url: z.string(),
        title: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export type GenerateNadlanSourceUrlInput = z.infer<typeof generateNadlanSourceUrlInputSchema>;
export type GenerateNadlanSourceUrlOutput = z.infer<typeof generateNadlanSourceUrlOutputSchema>;

export const generateNadlanSourceUrl = createTool({
    id: 'generateNadlanSourceUrl',
    description: 'Generate a Govmap portal URL so users can view real estate data on the map.',
    inputSchema: generateNadlanSourceUrlInputSchema,
    outputSchema: generateNadlanSourceUrlOutputSchema,
    execute: async ({ longitude, latitude, title, query }) => {
        const url = buildGovmapPortalUrl(longitude, latitude, query);
        return { success: true as const, url, title };
    },
});
