/**
 * List Organizations Tool
 *
 * AI SDK tool for listing all organizations on data.gov.il
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '../api/datagov.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const listOrganizationsInputSchema = z.object({
    ...commonToolInput,
});

export const listOrganizationsOutputSchema = toolOutputSchema({
    count: z.number(),
    organizations: z.array(z.string()),
});

export type ListOrganizationsInput = z.infer<typeof listOrganizationsInputSchema>;
export type ListOrganizationsOutput = z.infer<typeof listOrganizationsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listOrganizations = createTool({
    id: 'listOrganizations',
    description:
        'Get a list of all organization names on data.gov.il. Use when user asks which government bodies or organizations publish data.',
    inputSchema: listOrganizationsInputSchema,
    execute: async () => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.organization.list);

        try {
            const organizations = await dataGovApi.organization.list();

            return {
                success: true as const,
                count: organizations.length,
                organizations,
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
