/**
 * Generate Data.gov.il Source URL Tool
 *
 * Generates a clickable portal URL so users can view dataset data
 * directly on data.gov.il in their browser.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { buildDatasetPortalUrl, buildResourcePortalUrl } from '@/constants/datagov-urls';

export const generateDataGovSourceUrlInputSchema = z.object({
    orgName: z.string().describe('Organization slug/name (e.g., "labor", "airport_authority")'),
    datasetName: z.string().describe('Dataset slug/name from dataset details'),
    resourceId: z.string().optional().describe('Resource UUID for direct resource link'),
    title: z.string().describe('Hebrew display title for the source link'),
});

export const generateDataGovSourceUrlOutputSchema = z.discriminatedUnion('success', [
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

export type GenerateDataGovSourceUrlInput = z.infer<typeof generateDataGovSourceUrlInputSchema>;
export type GenerateDataGovSourceUrlOutput = z.infer<typeof generateDataGovSourceUrlOutputSchema>;

export const generateDataGovSourceUrl = tool({
    description: 'Generate a clickable data.gov.il portal URL so users can view dataset data in a browser table.',
    inputSchema: generateDataGovSourceUrlInputSchema,
    execute: async ({ orgName, datasetName, resourceId, title }) => {
        const url = resourceId
            ? buildResourcePortalUrl(orgName, datasetName, resourceId)
            : buildDatasetPortalUrl(orgName, datasetName);
        return { success: true as const, url, title };
    },
});
