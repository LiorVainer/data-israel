/**
 * CBS Tool Translations
 *
 * Hebrew translations and formatters for CBS tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import {
    ActivityIcon,
    BarChart2Icon,
    DatabaseIcon,
    LineChartIcon,
    LinkIcon,
    SearchIcon,
} from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { CbsToolName } from './tools';

export const cbsTranslations: Partial<Record<CbsToolName, ToolTranslation>> = {
    browseCbsCatalog: {
        name: 'חיפוש בנושאי הלמ"ס',
        icon: DatabaseIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.subject === 'string') return `מחפש: "${i.subject}"`;
            return 'סורק נושאים בלמ"ס...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const items = o.items as unknown[] | undefined;
            return `נמצאו ${items?.length ?? 0} תוצאות`;
        },
    },
    browseCbsCatalogPath: {
        name: 'בחירת נושא בלמ"ס',
        icon: DatabaseIcon,
        formatInput: () => 'בוחר נושא בלמ"ס...',
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const items = o.items as unknown[] | undefined;
            return `נמצאו ${items?.length ?? 0} פריטים`;
        },
    },
    getCbsSeriesData: {
        name: 'שליפת נתונים מהלמ"ס',
        icon: BarChart2Icon,
        formatInput: () => 'שולף נתונים מהלמ"ס...',
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const series = o.series as Array<{ observations: unknown[] }> | undefined;
            const obsCount = series?.reduce((sum, s) => sum + s.observations.length, 0) ?? 0;
            return `נשלפו ${obsCount} רשומות`;
        },
    },
    getCbsSeriesDataByPath: {
        name: 'שליפת נתונים לפי נושא',
        icon: BarChart2Icon,
        formatInput: () => 'שולף נתונים לפי נושא...',
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const series = o.series as Array<{ observations: unknown[] }> | undefined;
            const obsCount = series?.reduce((sum, s) => sum + s.observations.length, 0) ?? 0;
            return `נשלפו ${obsCount} רשומות`;
        },
    },
    browseCbsPriceIndices: {
        name: 'חיפוש מדדי מחירים',
        icon: LineChartIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            return 'טוען מדדי מחירים...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const items = o.items as unknown[] | undefined;
            return `נמצאו ${items?.length ?? 0} מדדים`;
        },
    },
    getCbsPriceData: {
        name: 'שליפת נתוני מחירים',
        icon: LineChartIcon,
        formatInput: () => 'שולף נתוני מחירים...',
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const indices = o.indices as Array<{ data: unknown[] }> | undefined;
            const dataCount = indices?.reduce((sum, idx) => sum + idx.data.length, 0) ?? 0;
            return `נשלפו ${dataCount} רשומות`;
        },
    },
    calculateCbsPriceIndex: {
        name: 'חישוב שינוי מדד',
        icon: ActivityIcon,
        formatInput: () => 'מחשב שינוי מדד...',
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            return 'החישוב הושלם';
        },
    },
    searchCbsLocalities: {
        name: 'חיפוש יישובים',
        icon: SearchIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.query === 'string') return `מחפש יישוב: "${i.query}"`;
            return 'מחפש יישובים...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const localities = o.localities as unknown[] | undefined;
            return `נמצאו ${localities?.length ?? 0} יישובים`;
        },
    },
    generateCbsSourceUrl: {
        name: 'יצירת קישור למקור למ"ס',
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
