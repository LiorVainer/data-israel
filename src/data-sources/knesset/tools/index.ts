/**
 * Knesset (Parliament) Tools
 *
 * Re-exports all Knesset tools and collects declarative source URL configs.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

// Tool exports
export { searchKnessetBills } from './search-bills.tool';
export { getKnessetBillInfo } from './get-bill-info.tool';
export { getKnessetCommitteeInfo } from './get-committee-info.tool';
export { listKnessetCommittees } from './list-committees.tool';
export { getKnessetMembers } from './get-knesset-members.tool';
export { getCurrentKnesset } from './get-current-knesset.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { searchKnessetBills } from './search-bills.tool';
import { getKnessetBillInfo } from './get-bill-info.tool';
import { getKnessetCommitteeInfo } from './get-committee-info.tool';
import { listKnessetCommittees } from './list-committees.tool';
import { getKnessetMembers } from './get-knesset-members.tool';
import { getCurrentKnesset } from './get-current-knesset.tool';

/** All Knesset tools as a single object */
export const KnessetTools = {
    searchKnessetBills,
    getKnessetBillInfo,
    getKnessetCommitteeInfo,
    listKnessetCommittees,
    getKnessetMembers,
    getCurrentKnesset,
};

/** Union of all Knesset tool names, derived from the KnessetTools object */
export type KnessetToolName = keyof typeof KnessetTools;

// ============================================================================
// Declarative source URL configs
// ============================================================================

/** Declarative source configs for Knesset tools — registry auto-generates resolvers */
export const knessetSourceConfigs: Partial<Record<KnessetToolName, ToolSourceConfig>> = {
    searchKnessetBills: { title: 'הצעות חוק' },
    getKnessetBillInfo: { title: 'הצעת חוק' },
    getKnessetCommitteeInfo: { title: 'ועדת כנסת' },
    listKnessetCommittees: { title: 'ועדות כנסת' },
    getKnessetMembers: { title: 'חברי כנסת' },
};
