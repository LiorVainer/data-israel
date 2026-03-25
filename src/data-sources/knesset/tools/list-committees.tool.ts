/**
 * List Committees Tool
 *
 * Lists Knesset committees by Knesset number.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { knessetApi } from '../api/knesset.client';
import { buildKnessetUrl, KNESSET_ENTITIES } from '../api/knesset.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Helpers
// ============================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
}

// ============================================================================
// Schemas
// ============================================================================

const committeeSummarySchema = z.object({
    committeeId: z.number(),
    name: z.string(),
    categoryDesc: z.string().nullable(),
    committeeTypeDesc: z.string().nullable(),
    isCurrent: z.boolean(),
});

export const listCommitteesInputSchema = z.object({
    knessetNum: z.number().int().min(1).max(25).describe('מספר הכנסת (למשל 25 לכנסת הנוכחית)'),
    maxResults: z.number().int().min(1).max(100).optional().describe('מספר תוצאות מקסימלי (ברירת מחדל: 50)'),
    ...commonToolInput,
});

export const listCommitteesOutputSchema = toolOutputSchema({
    knessetNum: z.number(),
    committees: z.array(committeeSummarySchema),
    totalFound: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const listKnessetCommittees = createTool({
    id: 'listKnessetCommittees',
    description: 'רשימת ועדות הכנסת לפי מספר כנסת. מחזיר שם, סוג וסטטוס כל ועדה.',
    inputSchema: listCommitteesInputSchema,
    outputSchema: listCommitteesOutputSchema,
    execute: async ({ knessetNum, maxResults = 50 }) => {
        const apiUrl = buildKnessetUrl(KNESSET_ENTITIES.COMMITTEES, {
            $filter: `KnessetNum eq ${knessetNum}`,
            $top: maxResults,
        });

        try {
            const result = await knessetApi.listCommittees(knessetNum, maxResults);

            if (result.committees.length === 0) {
                return {
                    success: false as const,
                    error: `לא נמצאו ועדות עבור כנסת ה-${knessetNum}`,
                    apiUrl,
                };
            }

            return {
                success: true as const,
                knessetNum,
                committees: result.committees.map((c) => ({
                    committeeId: c.CommitteeID,
                    name: c.Name,
                    categoryDesc: c.CategoryDesc,
                    committeeTypeDesc: c.CommitteeTypeDesc,
                    isCurrent: c.IsCurrent,
                })),
                totalFound: result.totalFound,
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

// ============================================================================
// Source URL Resolver
// ============================================================================

export const resolveSourceUrl: ToolSourceResolver = (_input, output) => {
    const apiUrl = getString(output, 'apiUrl');
    if (!apiUrl) return null;
    const name = getString(_input, 'searchedResourceName');
    return {
        url: apiUrl,
        title: name ? `ועדות כנסת — ${name}` : 'ועדות כנסת',
        urlType: 'api',
    };
};
