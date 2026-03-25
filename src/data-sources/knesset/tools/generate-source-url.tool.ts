/**
 * Generate Knesset Source URL Tool
 *
 * Generates a clickable Knesset portal URL so users can view
 * parliamentary data directly on the Knesset website.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
    buildKnessetPortalUrl,
    buildBillPortalUrl,
    buildCommitteePortalUrl,
    buildMembersPortalUrl,
} from '../api/knesset.endpoints';

// ============================================================================
// Schemas
// ============================================================================

export const generateKnessetSourceUrlInputSchema = z.object({
    entityType: z
        .enum(['bill', 'committee', 'members', 'general'])
        .describe('סוג הישות: bill=הצעת חוק, committee=ועדה, members=חברי כנסת, general=אתר הכנסת'),
    entityId: z.number().optional().describe('מזהה הישות (למשל BillID או CommitteeID)'),
    knessetNum: z.number().optional().describe('מספר כנסת (למשל 25)'),
    title: z.string().describe('כותרת בעברית לקישור המקור'),
});

export const generateKnessetSourceUrlOutputSchema = z.discriminatedUnion('success', [
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

export const generateKnessetSourceUrl = createTool({
    id: 'generateKnessetSourceUrl',
    description: 'יצירת קישור לאתר הכנסת כדי שהמשתמש יוכל לצפות בנתונים ישירות.',
    inputSchema: generateKnessetSourceUrlInputSchema,
    outputSchema: generateKnessetSourceUrlOutputSchema,
    execute: async ({ entityType, entityId, knessetNum, title }) => {
        let url: string;

        switch (entityType) {
            case 'bill':
                url = entityId ? buildBillPortalUrl(entityId) : buildKnessetPortalUrl();
                break;
            case 'committee':
                url = entityId ? buildCommitteePortalUrl(entityId) : buildKnessetPortalUrl();
                break;
            case 'members':
                url = knessetNum ? buildMembersPortalUrl(knessetNum) : buildKnessetPortalUrl();
                break;
            default:
                url = buildKnessetPortalUrl();
        }

        return { success: true as const, url, title };
    },
});
