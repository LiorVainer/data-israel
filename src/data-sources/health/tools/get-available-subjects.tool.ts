/**
 * Get Available Subjects Tool
 *
 * Returns all available health data subjects with descriptions.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { HEALTH_SUBJECTS_INFO } from '../api/health.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getAvailableSubjectsInputSchema = z.object({
    ...commonToolInput,
});

export const getAvailableSubjectsOutputSchema = toolOutputSchema({
    subjects: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
        }),
    ),
    totalCount: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getAvailableSubjects = createTool({
    id: 'getAvailableSubjects',
    description:
        'Get a list of all available health data subjects with Hebrew names and descriptions. Use this first to discover what health data topics are available.',
    inputSchema: getAvailableSubjectsInputSchema,
    outputSchema: getAvailableSubjectsOutputSchema,
    execute: async () => {
        const subjects = Object.entries(HEALTH_SUBJECTS_INFO).map(([id, info]) => ({
            id,
            name: info.name,
            description: info.description,
        }));

        return {
            success: true as const,
            subjects,
            totalCount: subjects.length,
        };
    },
});
