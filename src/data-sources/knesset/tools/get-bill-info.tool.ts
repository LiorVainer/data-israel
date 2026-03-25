/**
 * Get Bill Info Tool
 *
 * Retrieves detailed information about a specific Knesset bill by ID,
 * including initiators.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { knessetApi } from '../api/knesset.client';
import { buildEntityByIdUrl, KNESSET_ENTITIES, buildBillPortalUrl } from '../api/knesset.endpoints';
import { BILL_SUB_TYPES } from '../api/knesset.types';
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

const initiatorSchema = z.object({
    personId: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    isInitiator: z.boolean(),
});

export const getBillInfoInputSchema = z.object({
    billId: z.number().int().positive().describe('מזהה ייחודי של הצעת החוק (BillID)'),
    ...commonToolInput,
});

export const getBillInfoOutputSchema = toolOutputSchema({
    bill: z.object({
        billId: z.number(),
        name: z.string(),
        knessetNum: z.number(),
        subTypeDesc: z.string(),
        statusId: z.number(),
        privateNumber: z.string().nullable(),
        committeeId: z.number().nullable(),
        publicationDate: z.string().nullable(),
        publicationSeriesDesc: z.string().nullable(),
        summaryLaw: z.string().nullable(),
    }),
    initiators: z.array(initiatorSchema),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getKnessetBillInfo = createTool({
    id: 'getKnessetBillInfo',
    description: 'קבלת מידע מפורט על הצעת חוק לפי מזהה — כולל שם, סוג, סטטוס, מועד פרסום ויוזמים.',
    inputSchema: getBillInfoInputSchema,
    outputSchema: getBillInfoOutputSchema,
    execute: async ({ billId }) => {
        const apiUrl = buildEntityByIdUrl(KNESSET_ENTITIES.BILL_BY_ID, billId);
        const portalUrl = buildBillPortalUrl(billId);

        try {
            const bill = await knessetApi.getBillById(billId);

            if (!bill) {
                return {
                    success: false as const,
                    error: `לא נמצאה הצעת חוק עם מזהה ${billId}`,
                    apiUrl,
                    portalUrl,
                };
            }

            const initiators = await knessetApi.getBillInitiators(billId);

            return {
                success: true as const,
                bill: {
                    billId: bill.BillID,
                    name: bill.Name,
                    knessetNum: bill.KnessetNum,
                    subTypeDesc: BILL_SUB_TYPES[bill.SubTypeID] ?? bill.SubTypeDesc,
                    statusId: bill.StatusID,
                    privateNumber: bill.PrivateNumber,
                    committeeId: bill.CommitteeID,
                    publicationDate: bill.PublicationDate,
                    publicationSeriesDesc: bill.PublicationSeriesDesc,
                    summaryLaw: bill.SummaryLaw,
                },
                initiators: initiators.map((init) => ({
                    personId: init.PersonID,
                    firstName: init.KNS_Person?.FirstName ?? '',
                    lastName: init.KNS_Person?.LastName ?? '',
                    isInitiator: init.IsInitiator,
                })),
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
        title: name ? `הצעת חוק — ${name}` : 'הצעת חוק — הכנסת',
        urlType: 'portal',
    };
};
