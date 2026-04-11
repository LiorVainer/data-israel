/**
 * Get Health Links Tool
 *
 * Get relevant links and documentation for a health subject area.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { healthApi } from '../../api/overview-data/overview-data.client';
import { HEALTH_SUBJECTS, buildHealthMetadataUrl } from '../../api/overview-data/overview-data.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getHealthLinksInputSchema = z.object({
    subject: z.enum(HEALTH_SUBJECTS).describe('Health subject ID (from getAvailableSubjects)'),
    sectionId: z.string().optional().describe('Optional section ID to filter links'),
    ...commonToolInput,
});

export const getHealthLinksOutputSchema = toolOutputSchema({
    links: z.array(
        z.object({
            id: z.string(),
            url: z.string(),
            sectionId: z.string(),
        }),
    ),
    totalCount: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getHealthLinks = createTool({
    id: 'getHealthLinks',
    description:
        'Get relevant links and documentation resources for a health subject area. Optionally filter by section.',
    inputSchema: getHealthLinksInputSchema,
    outputSchema: getHealthLinksOutputSchema,
    execute: async ({ subject, sectionId }) => {
        const apiUrl = buildHealthMetadataUrl(subject);

        try {
            const metadata = await healthApi.getMetadata(subject);

            // Links are at the top level, each with a sectionId
            const allLinks = (metadata.links ?? [])
                .filter((link) => !sectionId || link.sectionId === sectionId)
                .map((link) => ({
                    id: link.id,
                    url: link.url,
                    sectionId: link.sectionId,
                }));

            if (allLinks.length === 0) {
                return {
                    success: false as const,
                    error: sectionId
                        ? `לא נמצאו קישורים עבור המקטע "${sectionId}" בנושא "${subject}".`
                        : `לא נמצאו קישורים עבור הנושא "${subject}".`,
                    apiUrl,
                };
            }

            return {
                success: true as const,
                links: allLinks,
                totalCount: allLinks.length,
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
