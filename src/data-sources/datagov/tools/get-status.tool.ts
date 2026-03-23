/**
 * Get Status Tool
 *
 * AI SDK tool for retrieving CKAN system status and version information
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '../api/datagov.endpoints';
import { toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getStatusInputSchema = z.object({});

export const getStatusOutputSchema = toolOutputSchema({
    status: z.object({
        ckanVersion: z.string(),
        siteTitle: z.string(),
        siteDescription: z.string(),
        siteUrl: z.string(),
        extensions: z.array(z.string()),
    }),
});

export type GetStatusInput = z.infer<typeof getStatusInputSchema>;
export type GetStatusOutput = z.infer<typeof getStatusOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getStatus = createTool({
    id: 'getStatus',
    description:
        'Get the CKAN version and list of installed extensions. Use when user asks about the data portal capabilities or system information.',
    inputSchema: getStatusInputSchema,
    execute: async () => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.system.statusShow);

        try {
            const status = await dataGovApi.system.status();

            return {
                success: true as const,
                status: {
                    ckanVersion: status.ckan_version,
                    siteTitle: status.site_title,
                    siteDescription: status.site_description,
                    siteUrl: status.site_url,
                    extensions: status.extensions,
                },
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
