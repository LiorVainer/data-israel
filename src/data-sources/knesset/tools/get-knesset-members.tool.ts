/**
 * Get Knesset Members Tool
 *
 * Retrieves Knesset members by Knesset number (PositionID=43).
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { knessetApi } from '../api/knesset.client';
import { buildKnessetUrl, KNESSET_ENTITIES, buildMembersPortalUrl } from '../api/knesset.endpoints';
import { POSITION_IDS } from '../api/knesset.types';
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

const memberSchema = z.object({
    personId: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    startDate: z.string().nullable(),
    finishDate: z.string().nullable(),
});

export const getKnessetMembersInputSchema = z.object({
    knessetNum: z.number().int().min(1).max(25).describe('מספר הכנסת (למשל 25 לכנסת הנוכחית)'),
    maxResults: z.number().int().min(1).max(200).optional().describe('מספר תוצאות מקסימלי (ברירת מחדל: 150)'),
    ...commonToolInput,
});

export const getKnessetMembersOutputSchema = toolOutputSchema({
    knessetNum: z.number(),
    members: z.array(memberSchema),
    totalFound: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getKnessetMembers = createTool({
    id: 'getKnessetMembers',
    description: 'רשימת חברי כנסת לפי מספר כנסת. מחזיר שם, תאריך תחילה וסיום כהונה.',
    inputSchema: getKnessetMembersInputSchema,
    outputSchema: getKnessetMembersOutputSchema,
    execute: async ({ knessetNum, maxResults = 150 }) => {
        const apiUrl = buildKnessetUrl(KNESSET_ENTITIES.PERSON_TO_POSITION, {
            $filter: `KnessetNum eq ${knessetNum} and PositionID eq ${POSITION_IDS.KNESSET_MEMBER}`,
            $expand: 'KNS_Person',
            $top: maxResults,
        });
        const portalUrl = buildMembersPortalUrl(knessetNum);

        try {
            const result = await knessetApi.getKnessetMembers(knessetNum, maxResults);

            if (result.members.length === 0) {
                return {
                    success: false as const,
                    error: `לא נמצאו חברי כנסת עבור כנסת ה-${knessetNum}`,
                    apiUrl,
                    portalUrl,
                };
            }

            return {
                success: true as const,
                knessetNum,
                members: result.members.map((m) => ({
                    personId: m.PersonID,
                    firstName: m.KNS_Person?.FirstName ?? '',
                    lastName: m.KNS_Person?.LastName ?? '',
                    startDate: m.StartDate,
                    finishDate: m.FinishDate,
                })),
                totalFound: result.totalFound,
                apiUrl,
                portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                apiUrl,
                portalUrl,
            };
        }
    },
});

// ============================================================================
// Source URL Resolver
// ============================================================================

export const resolveSourceUrl: ToolSourceResolver = (_input, output) => {
    const portalUrl = getString(output, 'portalUrl');
    if (!portalUrl) return null;
    const name = getString(_input, 'searchedResourceName');
    return {
        url: portalUrl,
        title: name ? `חברי כנסת — ${name}` : 'חברי כנסת',
        urlType: 'portal',
    };
};
