/**
 * Knesset (Parliament) Tools
 *
 * Re-exports all Knesset tools and collects source URL resolvers.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Tool exports
export { searchKnessetBills } from './search-bills.tool';
export { getKnessetBillInfo } from './get-bill-info.tool';
export { getKnessetCommitteeInfo } from './get-committee-info.tool';
export { listKnessetCommittees } from './list-committees.tool';
export { getKnessetMembers } from './get-knesset-members.tool';
export { getCurrentKnesset } from './get-current-knesset.tool';
export { generateKnessetSourceUrl } from './generate-source-url.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { searchKnessetBills } from './search-bills.tool';
import { getKnessetBillInfo } from './get-bill-info.tool';
import { getKnessetCommitteeInfo } from './get-committee-info.tool';
import { listKnessetCommittees } from './list-committees.tool';
import { getKnessetMembers } from './get-knesset-members.tool';
import { getCurrentKnesset } from './get-current-knesset.tool';
import { generateKnessetSourceUrl } from './generate-source-url.tool';

/** All Knesset tools as a single object */
export const KnessetTools = {
    searchKnessetBills,
    getKnessetBillInfo,
    getKnessetCommitteeInfo,
    listKnessetCommittees,
    getKnessetMembers,
    getCurrentKnesset,
    generateKnessetSourceUrl,
};

/** Union of all Knesset tool names, derived from the KnessetTools object */
export type KnessetToolName = keyof typeof KnessetTools;

// ============================================================================
// Source URL resolvers (co-located in tool files)
// ============================================================================

import { resolveSourceUrl as searchBillsResolver } from './search-bills.tool';
import { resolveSourceUrl as getBillInfoResolver } from './get-bill-info.tool';
import { resolveSourceUrl as getCommitteeInfoResolver } from './get-committee-info.tool';
import { resolveSourceUrl as listCommitteesResolver } from './list-committees.tool';
import { resolveSourceUrl as getKnessetMembersResolver } from './get-knesset-members.tool';

/** Collected source resolvers for Knesset tools */
export const knessetSourceResolvers: Partial<Record<KnessetToolName, ToolSourceResolver>> = {
    searchKnessetBills: searchBillsResolver,
    getKnessetBillInfo: getBillInfoResolver,
    getKnessetCommitteeInfo: getCommitteeInfoResolver,
    listKnessetCommittees: listCommitteesResolver,
    getKnessetMembers: getKnessetMembersResolver,
};
