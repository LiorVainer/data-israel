/**
 * Generate Drugs Source URL Tool
 *
 * Generates a clickable source URL for the Israeli drugs registry
 * so users can view the drug information directly.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildDrugsPortalUrl } from '../api/drugs.endpoints';

export const generateDrugsSourceUrlInputSchema = z.object({
    registrationNumber: z.string().optional().describe('Drug registration number for direct link'),
    title: z.string().describe('Hebrew display title for the source link'),
});

export const generateDrugsSourceUrlOutputSchema = z.discriminatedUnion('success', [
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

export const generateDrugsSourceUrl = createTool({
    id: 'generateDrugsSourceUrl',
    description: 'Generate a source URL for the Israeli drugs registry so users can view drug information directly.',
    inputSchema: generateDrugsSourceUrlInputSchema,
    outputSchema: generateDrugsSourceUrlOutputSchema,
    execute: async ({ registrationNumber, title }) => {
        const url = buildDrugsPortalUrl(registrationNumber);
        return { success: true as const, url, title };
    },
});
