/**
 * CBS Tool Translations
 *
 * Hebrew translations for CBS tools displayed in the UI.
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
    },
    browseCbsCatalogPath: {
        name: 'בחירת נושא בלמ"ס',
        icon: DatabaseIcon,
    },
    getCbsSeriesData: {
        name: 'שליפת נתונים מהלמ"ס',
        icon: BarChart2Icon,
    },
    getCbsSeriesDataByPath: {
        name: 'שליפת נתונים לפי נושא',
        icon: BarChart2Icon,
    },
    browseCbsPriceIndices: {
        name: 'חיפוש מדדי מחירים',
        icon: LineChartIcon,
    },
    getCbsPriceData: {
        name: 'שליפת נתוני מחירים',
        icon: LineChartIcon,
    },
    calculateCbsPriceIndex: {
        name: 'חישוב שינוי מדד',
        icon: ActivityIcon,
    },
    searchCbsLocalities: {
        name: 'חיפוש יישובים',
        icon: SearchIcon,
    },
    generateCbsSourceUrl: {
        name: 'יצירת קישור למקור למ"ס',
        icon: LinkIcon,
    },
};
