/**
 * Generate Shufersal Source URL Tool
 *
 * Generates a clickable Shufersal portal URL so users can view
 * product data directly on the Shufersal website.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildSearchPortalUrl } from '../api/shufersal.endpoints';

// ============================================================================
// Schemas
// ============================================================================

export const generateShufersalSourceUrlInputSchema = z.object({
    query: z.string().describe('שאילתת החיפוש המקורית לבניית קישור'),
    title: z.string().describe('כותרת בעברית לקישור המקור'),
});

export const generateShufersalSourceUrlOutputSchema = z.discriminatedUnion('success', [
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

// ============================================================================
// Tool Definition
// ============================================================================

export const generateShufersalSourceUrl = createTool({
    id: 'generateShufersalSourceUrl',
    description: 'יצירת קישור לאתר שופרסל אונליין כדי שהמשתמש יוכל לצפות בתוצאות החיפוש ישירות.',
    inputSchema: generateShufersalSourceUrlInputSchema,
    outputSchema: generateShufersalSourceUrlOutputSchema,
    execute: async ({ query, title }) => {
        const url = buildSearchPortalUrl(query);
        return { success: true as const, url, title };
    },
});
