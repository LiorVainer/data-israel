/**
 * GovMap Tool Translations
 *
 * Hebrew translations and formatters for GovMap tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import { BarChart2Icon, HomeIcon, LinkIcon, MapPinIcon, SearchIcon, TrendingUpIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { GovmapToolName } from './tools';

export const govmapTranslations: Partial<Record<GovmapToolName, ToolTranslation>> = {
    autocompleteNadlanAddress: {
        name: 'חיפוש כתובת',
        icon: SearchIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchText === 'string') return `מחפש: "${i.searchText}"`;
            return 'מחפש כתובת...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const results = o.results as unknown[] | undefined;
            return `נמצאו ${results?.length ?? 0} כתובות`;
        },
    },
    findRecentNadlanDeals: {
        name: 'חיפוש עסקאות נדל"ן',
        icon: HomeIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.address === 'string') return `מחפש עסקאות ליד "${i.address}"`;
            return 'מחפש עסקאות נדל"ן...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const deals = o.deals as unknown[] | undefined;
            return `נמצאו ${deals?.length ?? 0} עסקאות`;
        },
    },
    getStreetNadlanDeals: {
        name: 'עסקאות ברחוב',
        icon: MapPinIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            return 'שולף עסקאות רחוב...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const deals = o.deals as unknown[] | undefined;
            return `נמצאו ${deals?.length ?? 0} עסקאות`;
        },
    },
    getNeighborhoodNadlanDeals: {
        name: 'עסקאות בשכונה',
        icon: MapPinIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            return 'שולף עסקאות שכונה...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const deals = o.deals as unknown[] | undefined;
            return `נמצאו ${deals?.length ?? 0} עסקאות`;
        },
    },
    getNadlanValuationComparables: {
        name: 'הערכת שווי נכס',
        icon: BarChart2Icon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.address === 'string') return `מעריך שווי ליד "${i.address}"`;
            return 'מחפש נכסים להשוואה...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const count = o.comparableCount as number | undefined;
            return `נמצאו ${count ?? 0} נכסים להשוואה`;
        },
    },
    getNadlanMarketActivity: {
        name: 'ניתוח שוק נדל"ן',
        icon: TrendingUpIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.address === 'string') return `מנתח שוק ליד "${i.address}"`;
            return 'מנתח מגמות שוק...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const total = o.totalDealsAnalyzed as number | undefined;
            return `ניתוח ${total ?? 0} עסקאות`;
        },
    },
    getNadlanDealStatistics: {
        name: 'סטטיסטיקת עסקאות',
        icon: BarChart2Icon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.address === 'string') return `סטטיסטיקה ליד "${i.address}"`;
            return 'מחשב סטטיסטיקה...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            return 'הסטטיסטיקה חושבה';
        },
    },
    generateNadlanSourceUrl: {
        name: 'יצירת קישור למקור נדל"ן',
        icon: LinkIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.title === 'string') return `יוצר קישור: "${i.title}"`;
            return 'יוצר קישור למקור...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === true && typeof o.title === 'string') return o.title;
            return undefined;
        },
    },
};
