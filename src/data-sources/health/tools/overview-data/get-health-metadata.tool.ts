/**
 * Get Health Metadata Tool
 *
 * Get metadata about available data endpoints for a specific health subject.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { healthApi } from '../../api/overview-data/overview-data.client';
import { HEALTH_SUBJECTS, buildHealthMetadataUrl } from '../../api/overview-data/overview-data.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getHealthMetadataInputSchema = z.object({
    subject: z.enum(HEALTH_SUBJECTS).describe('Health subject ID (from getAvailableSubjects)'),
    ...commonToolInput,
});

export const getHealthMetadataOutputSchema = toolOutputSchema({
    endpoints: z.array(
        z.object({
            cardId: z.string(),
            endPointName: z.string(),
            componentName: z.string(),
            sectionId: z.string(),
            embedLink: z.string().nullable(),
        }),
    ),
    sections: z.array(
        z.object({
            sectionId: z.string(),
            type: z.string(),
            dataTypeName: z.string(),
        }),
    ),
    links: z.array(
        z.object({
            url: z.string(),
            sectionId: z.string(),
        }),
    ),
    totalEndpoints: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getHealthMetadata = createTool({
    id: 'getHealthMetadata',
    description:
        'Get metadata about available data endpoints for a specific health subject. Returns endpoint names, descriptions, and sections. Use endpoint names with getHealthData to fetch actual data.',
    inputSchema: getHealthMetadataInputSchema,
    outputSchema: getHealthMetadataOutputSchema,
    execute: async ({ subject }) => {
        const apiUrl = buildHealthMetadataUrl(subject);

        try {
            const metadata = await healthApi.getMetadata(subject);

            // Deduplicate cards by endPointName (multiple cards can reference the same endpoint)
            const seen = new Set<string>();
            const endpoints = (metadata.cards ?? [])
                .filter((card) => {
                    const ep = card.endPointName.trim();
                    if (seen.has(ep)) return false;
                    seen.add(ep);
                    return true;
                })
                .map((card) => ({
                    cardId: card.id,
                    endPointName: card.endPointName.trim(),
                    componentName: card.componentName,
                    sectionId: card.sectionId,
                    embedLink: card.embedLink,
                }));

            const sections = (metadata.sections ?? []).map((s) => ({
                sectionId: s.id,
                type: s.type,
                dataTypeName: s.dataTypeName,
            }));

            const links = (metadata.links ?? []).map((l) => ({
                url: l.url,
                sectionId: l.sectionId,
            }));

            if (endpoints.length === 0) {
                return {
                    success: false as const,
                    error: `לא נמצאו נקודות נתונים עבור הנושא "${subject}".`,
                    apiUrl,
                };
            }

            return {
                success: true as const,
                endpoints,
                sections,
                links,
                totalEndpoints: endpoints.length,
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
