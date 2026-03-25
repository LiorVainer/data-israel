/**
 * Search Bills Tool
 *
 * Search Knesset bills by keyword with optional Knesset number filter.
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

const billSummarySchema = z.object({
    billId: z.number(),
    name: z.string(),
    knessetNum: z.number(),
    subTypeDesc: z.string(),
    statusId: z.number(),
    privateNumber: z.string().nullable(),
    publicationDate: z.string().nullable(),
});

export const searchBillsInputSchema = z.object({
    keyword: z.string().min(2).describe('מילת מפתח לחיפוש בשם הצעת החוק (עברית)'),
    knessetNum: z
        .number()
        .int()
        .min(1)
        .max(25)
        .optional()
        .describe('מספר כנסת לסינון (אופציונלי, למשל 25 עבור הכנסת הנוכחית)'),
    maxResults: z.number().int().min(1).max(50).optional().describe('מספר תוצאות מקסימלי (ברירת מחדל: 20)'),
    ...commonToolInput,
});

export const searchBillsOutputSchema = toolOutputSchema({
    keyword: z.string(),
    knessetNum: z.number().optional(),
    bills: z.array(billSummarySchema),
    totalFound: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const searchKnessetBills = createTool({
    id: 'searchKnessetBills',
    description:
        'חיפוש הצעות חוק לפי מילת מפתח בשם ההצעה. ניתן לסנן לפי מספר כנסת. מחזיר רשימת הצעות חוק עם פרטים בסיסיים.',
    inputSchema: searchBillsInputSchema,
    outputSchema: searchBillsOutputSchema,
    execute: async ({ keyword, knessetNum, maxResults = 20 }) => {
        const apiUrl = buildKnessetUrl(KNESSET_ENTITIES.BILLS, {
            $filter: knessetNum
                ? `substringof('${keyword}', Name) and KnessetNum eq ${knessetNum}`
                : `substringof('${keyword}', Name)`,
            $top: maxResults,
        });

        try {
            const result = await knessetApi.searchBills(keyword, knessetNum, maxResults);

            if (result.bills.length === 0) {
                return {
                    success: false as const,
                    error: `לא נמצאו הצעות חוק עבור "${keyword}"${knessetNum ? ` בכנסת ה-${knessetNum}` : ''}`,
                    apiUrl,
                };
            }

            return {
                success: true as const,
                keyword,
                knessetNum,
                bills: result.bills.map((b) => ({
                    billId: b.BillID,
                    name: b.Name,
                    knessetNum: b.KnessetNum,
                    subTypeDesc: b.SubTypeDesc,
                    statusId: b.StatusID,
                    privateNumber: b.PrivateNumber,
                    publicationDate: b.PublicationDate,
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
        title: name ? `הצעות חוק — ${name}` : 'הצעות חוק — הכנסת',
        urlType: 'api',
    };
};
