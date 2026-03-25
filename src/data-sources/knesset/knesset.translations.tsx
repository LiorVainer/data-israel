/**
 * Knesset Tool Translations
 *
 * Hebrew translations and icons for Knesset tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import { GavelIcon, InfoIcon, LandmarkIcon, LinkIcon, SearchIcon, UsersIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { KnessetToolName } from './tools';

export const knessetTranslations: Partial<Record<KnessetToolName, ToolTranslation>> = {
    searchKnessetBills: {
        name: 'חיפוש הצעות חוק',
        icon: SearchIcon,
    },
    getKnessetBillInfo: {
        name: 'פרטי הצעת חוק',
        icon: GavelIcon,
    },
    getKnessetCommitteeInfo: {
        name: 'פרטי ועדה',
        icon: InfoIcon,
    },
    listKnessetCommittees: {
        name: 'רשימת ועדות',
        icon: LandmarkIcon,
    },
    getKnessetMembers: {
        name: 'חברי כנסת',
        icon: UsersIcon,
    },
    getCurrentKnesset: {
        name: 'כנסת נוכחית',
        icon: LandmarkIcon,
    },
    generateKnessetSourceUrl: {
        name: 'יצירת קישור לכנסת',
        icon: LinkIcon,
    },
};
