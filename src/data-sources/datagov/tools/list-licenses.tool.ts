/**
 * List Licenses Tool
 *
 * AI SDK tool for listing available dataset licenses
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { dataGovApi } from '../api/datagov.client';
import { DATAGOV_ENDPOINTS, buildDataGovUrl } from '../api/datagov.endpoints';
import { toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const listLicensesInputSchema = z.object({});

export const listLicensesOutputSchema = toolOutputSchema({
    licenses: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            url: z.string(),
            isOkdCompliant: z.boolean().optional(),
            isOsiCompliant: z.boolean().optional(),
        }),
    ),
});

export type ListLicensesInput = z.infer<typeof listLicensesInputSchema>;
export type ListLicensesOutput = z.infer<typeof listLicensesOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const listLicenses = createTool({
    id: 'listLicenses',
    description:
        'Get the list of licenses available for datasets on data.gov.il. Use when user asks about data licenses or usage rights.',
    inputSchema: listLicensesInputSchema,
    execute: async () => {
        const apiUrl = buildDataGovUrl(DATAGOV_ENDPOINTS.system.licenseList);

        try {
            const licenses = await dataGovApi.system.licenses();

            return {
                success: true as const,
                licenses: licenses.map((l) => ({
                    id: l.id,
                    title: l.title,
                    url: l.url,
                    isOkdCompliant: l.is_okd_compliant,
                    isOsiCompliant: l.is_osi_compliant,
                })),
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
