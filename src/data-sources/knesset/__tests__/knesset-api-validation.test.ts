/**
 * Knesset API Validation Tests
 *
 * Calls real Knesset OData APIs and validates responses against declared Zod output schemas.
 * Catches schema drift when the external API (knesset.gov.il) changes.
 */

import { describe, it, expect } from 'vitest';
import { searchKnessetBills } from '../tools/search-bills.tool';
import { searchBillsOutputSchema } from '../tools/search-bills.tool';
import { getKnessetBillInfo } from '../tools/get-bill-info.tool';
import { getBillInfoOutputSchema } from '../tools/get-bill-info.tool';
import { getKnessetCommitteeInfo } from '../tools/get-committee-info.tool';
import { getCommitteeInfoOutputSchema } from '../tools/get-committee-info.tool';
import { listKnessetCommittees } from '../tools/list-committees.tool';
import { listCommitteesOutputSchema } from '../tools/list-committees.tool';
import { getKnessetMembers } from '../tools/get-knesset-members.tool';
import { getKnessetMembersOutputSchema } from '../tools/get-knesset-members.tool';
import { getCurrentKnesset } from '../tools/get-current-knesset.tool';
import { getCurrentKnessetOutputSchema } from '../tools/get-current-knesset.tool';

// Shared execution context type — tools require a second argument
const execCtx = {} as unknown as Record<string, unknown>;

describe.sequential('Knesset API validation', () => {
    it('searchKnessetBills output matches schema', async () => {
        const result = await searchKnessetBills.execute!(
            {
                keyword: 'חינוך',
                knessetNum: 25,
                maxResults: 3,
                searchedResourceName: 'test',
            },
            execCtx,
        );

        const parsed = searchBillsOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getKnessetBillInfo output matches schema', async () => {
        // BillID 23477 is a known bill in Knesset 25
        const result = await getKnessetBillInfo.execute!(
            {
                billId: 23477,
                searchedResourceName: 'test',
            },
            execCtx,
        );

        const parsed = getBillInfoOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getKnessetCommitteeInfo output matches schema', async () => {
        // CommitteeID 1 is the House Committee (ועדת הכנסת)
        const result = await getKnessetCommitteeInfo.execute!(
            {
                committeeId: 1,
                searchedResourceName: 'test',
            },
            execCtx,
        );

        const parsed = getCommitteeInfoOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('listKnessetCommittees output matches schema', async () => {
        const result = await listKnessetCommittees.execute!(
            {
                knessetNum: 25,
                maxResults: 5,
                searchedResourceName: 'test',
            },
            execCtx,
        );

        const parsed = listCommitteesOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getKnessetMembers output matches schema', async () => {
        const result = await getKnessetMembers.execute!(
            {
                knessetNum: 25,
                maxResults: 5,
                searchedResourceName: 'test',
            },
            execCtx,
        );

        const parsed = getKnessetMembersOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);

    it('getCurrentKnesset output matches schema', async () => {
        const result = await getCurrentKnesset.execute!({}, execCtx);

        const parsed = getCurrentKnessetOutputSchema.safeParse(result);
        if (!parsed.success) console.error(parsed.error.issues);
        expect(parsed.success).toBe(true);
    }, 30_000);
});
