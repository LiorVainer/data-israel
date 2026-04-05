/**
 * Get Committee Info Tool
 *
 * Retrieves detailed information about a specific Knesset committee by ID.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { knessetApi } from '../api/knesset.client';
import { buildEntityByIdUrl, KNESSET_ENTITIES, buildCommitteePortalUrl } from '../api/knesset.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const getCommitteeInfoInputSchema = z.object({
    committeeId: z.number().int().positive().describe('מזהה ייחודי של הוועדה (CommitteeID)'),
    ...commonToolInput,
});

export const getCommitteeInfoOutputSchema = toolOutputSchema({
    committee: z.object({
        committeeId: z.number(),
        name: z.string(),
        categoryDesc: z.string().nullable(),
        knessetNum: z.number(),
        committeeTypeDesc: z.string().nullable(),
        parentCommitteeId: z.number().nullable(),
        isCurrent: z.boolean(),
    }),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getKnessetCommitteeInfo = createTool({
    id: 'getKnessetCommitteeInfo',
    description: 'קבלת מידע מפורט על ועדת כנסת לפי מזהה — כולל שם, סוג, קטגוריה וסטטוס.',
    inputSchema: getCommitteeInfoInputSchema,
    outputSchema: getCommitteeInfoOutputSchema,
    execute: async ({ committeeId }) => {
        const apiUrl = buildEntityByIdUrl(KNESSET_ENTITIES.COMMITTEE_BY_ID, committeeId);
        const portalUrl = buildCommitteePortalUrl(committeeId);

        try {
            const committee = await knessetApi.getCommitteeById(committeeId);

            if (!committee) {
                return {
                    success: false as const,
                    error: `לא נמצאה ועדה עם מזהה ${committeeId}`,
                    apiUrl,
                    portalUrl,
                };
            }

            return {
                success: true as const,
                committee: {
                    committeeId: committee.CommitteeID,
                    name: committee.Name,
                    categoryDesc: committee.CategoryDesc,
                    knessetNum: committee.KnessetNum,
                    committeeTypeDesc: committee.CommitteeTypeDesc,
                    parentCommitteeId: committee.ParentCommitteeID,
                    isCurrent: committee.IsCurrent,
                },
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
