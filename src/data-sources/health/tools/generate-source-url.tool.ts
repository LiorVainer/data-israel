/**
 * Generate Health Source URL Tool
 *
 * Generates a clickable source URL for the health data dashboard
 * so users can view the data directly.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildHealthPortalUrl } from '../api/health.endpoints';

export const generateHealthSourceUrlInputSchema = z.object({
    subject: z.string().optional().describe('Health subject for direct link'),
    title: z.string().describe('Hebrew display title for the source link'),
});

export const generateHealthSourceUrlOutputSchema = z.discriminatedUnion('success', [
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

export const generateHealthSourceUrl = createTool({
    id: 'generateHealthSourceUrl',
    description: 'Generate a source URL for the health data dashboard so users can view health data directly.',
    inputSchema: generateHealthSourceUrlInputSchema,
    outputSchema: generateHealthSourceUrlOutputSchema,
    execute: async ({ subject, title }) => {
        const url = buildHealthPortalUrl(subject);
        return { success: true as const, url, title };
    },
});
