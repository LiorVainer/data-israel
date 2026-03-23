/**
 * Browse CBS Price Indices Tool
 *
 * AI SDK tool for browsing CBS price index catalog (chapters, topics, index codes)
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { cbsApi } from '../../api/cbs.client';
import { buildPriceIndexUrl, CBS_PRICE_INDEX_PATHS } from '../../api/cbs.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
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
    ...commonToolInput,
});

export const browseCbsPriceIndicesOutputSchema = toolOutputSchema({
    mode: z.string(),
    items: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            order: z.number().optional(),
            mainCode: z.number().nullable().optional(),
        }),
    ),
});

export type BrowseCbsPriceIndicesInput = z.infer<typeof browseCbsPriceIndicesInputSchema>;
export type BrowseCbsPriceIndicesOutput = z.infer<typeof browseCbsPriceIndicesOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const browseCbsPriceIndices = createTool({
    id: 'browseCbsPriceIndices',
    description:
        'Browse CBS price index catalog. Start with mode "chapters" to see main categories (CPI, housing, food, etc.), then "topics" to drill into a chapter, then "indices" to get specific index codes. Use index codes with getCbsPriceData.',
    inputSchema: browseCbsPriceIndicesInputSchema,
    outputSchema: browseCbsPriceIndicesOutputSchema,
    execute: async ({ mode, chapterId, subjectId, language }) => {
        // Construct API URL based on mode
        let apiUrl: string;
        if (mode === 'chapters') {
            apiUrl = buildPriceIndexUrl(CBS_PRICE_INDEX_PATHS.CATALOG, { lang: language });
        } else if (mode === 'topics') {
            apiUrl = buildPriceIndexUrl(CBS_PRICE_INDEX_PATHS.CHAPTER, { id: chapterId, lang: language });
        } else {
            apiUrl = buildPriceIndexUrl(CBS_PRICE_INDEX_PATHS.SUBJECT, { id: subjectId, lang: language });
        }

        try {
            if (mode === 'chapters') {
                const result = await cbsApi.priceIndex.catalog({ lang: language });
                return {
                    success: true as const,
                    mode,
                    items: result.chapters.map((ch) => ({
                        id: ch.chapterId,
                        name: ch.chapterName,
                        order: ch.chapterOrder,
                        mainCode: ch.mainCode,
                    })),
                    apiUrl,
                };
            }

            if (mode === 'topics') {
                if (!chapterId) {
                    return {
                        success: false as const,
                        error: 'chapterId is required when mode is "topics"',
                        apiUrl,
                    };
                }
                const result = await cbsApi.priceIndex.chapter(chapterId, { lang: language });
                return {
                    success: true as const,
                    mode,
                    items: result.subject.map((s) => ({
                        id: String(s.subjectId),
                        name: s.subjectName,
                    })),
                    apiUrl,
                };
            }

            // mode === 'indices'
            if (!subjectId) {
                return {
                    success: false as const,
                    error: 'subjectId is required when mode is "indices"',
                    apiUrl,
                };
            }
            const result = await cbsApi.priceIndex.subject(subjectId, { lang: language });
            return {
                success: true as const,
                mode,
                items: result.code.map((c) => ({
                    id: String(c.codeId),
                    name: c.codeName,
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
