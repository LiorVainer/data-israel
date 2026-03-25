/**
 * Get Health Metadata Tool
 *
 * Get metadata about available data endpoints for a specific health subject.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { healthApi } from '../api/health.client';
import { HEALTH_SUBJECTS, buildHealthMetadataUrl } from '../api/health.endpoints';
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
            endPointName: z.string(),
            dataName: z.string(),
            description: z.string(),
            embedLink: z.string().optional(),
        }),
    ),
    sections: z.array(
        z.object({
            sectionId: z.string(),
            sectionTitle: z.string(),
            endpointCount: z.number(),
            hasLinks: z.boolean(),
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

            const endpoints = (metadata.availableEndpoints ?? []).map((ep) => ({
                endPointName: ep.endPointName,
                dataName: ep.dataName,
                description: ep.description,
                embedLink: ep.embedLink,
            }));

            const sections = (metadata.sections ?? []).map((s) => ({
                sectionId: s.sectionId,
                sectionTitle: s.sectionTitle,
                endpointCount: (s.endpoints ?? []).length,
                hasLinks: (s.links ?? []).length > 0,
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
