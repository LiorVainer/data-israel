/**
 * Get Health Links Tool
 *
 * Get relevant links and documentation for a health subject area.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { healthApi } from '../api/health.client';
import { HEALTH_SUBJECTS, buildHealthMetadataUrl } from '../api/health.endpoints';
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
            title: z.string(),
            url: z.string(),
            description: z.string().optional(),
            sectionTitle: z.string().optional(),
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

            const allLinks: Array<{
                title: string;
                url: string;
                description?: string;
                sectionTitle?: string;
            }> = [];

            for (const section of metadata.sections ?? []) {
                if (sectionId && section.sectionId !== sectionId) continue;

                for (const link of section.links ?? []) {
                    allLinks.push({
                        title: link.title,
                        url: link.url,
                        description: link.description,
                        sectionTitle: section.sectionTitle,
                    });
                }
            }

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
