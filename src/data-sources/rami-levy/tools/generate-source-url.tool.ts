/**
 * Generate Rami Levy Source URL Tool
 *
 * Generates a clickable Rami Levy portal URL so users can view
 * product data directly on the Rami Levy website.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildSearchPortalUrl, buildProductPortalUrl, buildRamiLevyPortalUrl } from '../api/rami-levy.endpoints';

// ============================================================================
// Schemas
// ============================================================================

export const generateRamiLevySourceUrlInputSchema = z.object({
    entityType: z
        .enum(['search', 'product', 'general'])
        .describe('סוג הקישור: search=חיפוש מוצרים, product=מוצר ספציפי, general=אתר רמי לוי'),
    query: z.string().optional().describe('מילת חיפוש (עבור entityType=search)'),
    productId: z.union([z.string(), z.number()]).optional().describe('מזהה מוצר (עבור entityType=product)'),
    title: z.string().describe('כותרת בעברית לקישור המקור'),
});

export const generateRamiLevySourceUrlOutputSchema = z.discriminatedUnion('success', [
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

export const generateRamiLevySourceUrl = createTool({
    id: 'generateRamiLevySourceUrl',
    description: 'יצירת קישור לאתר רמי לוי כדי שהמשתמש יוכל לצפות במוצרים ובמחירים ישירות.',
    inputSchema: generateRamiLevySourceUrlInputSchema,
    outputSchema: generateRamiLevySourceUrlOutputSchema,
    execute: async ({ entityType, query, productId, title }) => {
        let url: string;

        switch (entityType) {
            case 'search':
                url = query ? buildSearchPortalUrl(query) : buildRamiLevyPortalUrl();
                break;
            case 'product':
                url = productId ? buildProductPortalUrl(productId) : buildRamiLevyPortalUrl();
                break;
            default:
                url = buildRamiLevyPortalUrl();
        }

        return { success: true as const, url, title };
    },
});
