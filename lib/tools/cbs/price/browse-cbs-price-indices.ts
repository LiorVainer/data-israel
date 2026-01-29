/**
 * Browse CBS Price Indices Tool
 *
 * AI SDK tool for browsing CBS price index catalog (chapters, topics, index codes)
 */

import { tool } from 'ai';
import { z } from 'zod';
import { cbsApi } from '@/lib/api/cbs/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const browseCbsPriceIndicesInputSchema = z.object({
    mode: z
        .enum(['chapters', 'topics', 'indices'])
        .describe(
            'What to browse: "chapters" for main categories, "topics" for topics within a chapter, "indices" for index codes within a topic',
        ),
    chapterId: z.string().optional().describe('Chapter ID (required when mode is "topics")'),
    subjectId: z.string().optional().describe('Subject/topic ID (required when mode is "indices")'),
    language: z.enum(['he', 'en']).optional().describe('Response language (default: Hebrew)'),
});

export const browseCbsPriceIndicesOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        mode: z.string(),
        items: z.array(
            z.object({
                id: z.string(),
                code: z.string().optional(),
                name: z.string(),
                base: z.string().optional(),
            }),
        ),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export type BrowseCbsPriceIndicesInput = z.infer<typeof browseCbsPriceIndicesInputSchema>;
export type BrowseCbsPriceIndicesOutput = z.infer<typeof browseCbsPriceIndicesOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const browseCbsPriceIndices = tool({
    description:
        'Browse CBS price index catalog. Start with mode "chapters" to see main categories (CPI, housing, food, etc.), then "topics" to drill into a chapter, then "indices" to get specific index codes. Use index codes with getCbsPriceData.',
    inputSchema: browseCbsPriceIndicesInputSchema,
    execute: async ({ mode, chapterId, subjectId, language }) => {
        try {
            if (mode === 'chapters') {
                const chapters = await cbsApi.priceIndex.catalog({ lang: language });
                return {
                    success: true,
                    mode,
                    items: (Array.isArray(chapters) ? chapters : []).map((ch) => ({
                        id: ch.id ?? ch.code ?? '',
                        code: ch.code,
                        name: ch.name ?? '',
                    })),
                };
            }

            if (mode === 'topics') {
                if (!chapterId) {
                    return { success: false, error: 'chapterId is required when mode is "topics"' };
                }
                const topics = await cbsApi.priceIndex.chapter(chapterId, { lang: language });
                return {
                    success: true,
                    mode,
                    items: (Array.isArray(topics) ? topics : []).map((t) => ({
                        id: t.id ?? t.code ?? '',
                        code: t.code,
                        name: t.name ?? '',
                    })),
                };
            }

            // mode === 'indices'
            if (!subjectId) {
                return { success: false, error: 'subjectId is required when mode is "indices"' };
            }
            const indices = await cbsApi.priceIndex.subject(subjectId, { lang: language });
            return {
                success: true,
                mode,
                items: (Array.isArray(indices) ? indices : []).map((idx) => ({
                    id: idx.id ?? idx.code ?? '',
                    code: idx.code,
                    name: idx.name ?? '',
                    base: idx.base,
                })),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
