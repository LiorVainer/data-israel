/**
 * Drugs Tool Translations
 *
 * Hebrew translations and formatters for drugs tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import { LinkIcon, ListIcon, PillIcon, SearchIcon, SyringeIcon, TagsIcon, TextSearchIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { DrugsToolName } from './tools';

export const drugsTranslations: Partial<Record<DrugsToolName, ToolTranslation>> = {
    searchDrugByName: {
        name: 'חיפוש תרופה לפי שם',
        icon: SearchIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.drugName === 'string') return `מחפש: "${i.drugName}"`;
            return 'מחפש תרופה...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const drugs = o.drugs as unknown[] | undefined;
            return `נמצאו ${drugs?.length ?? 0} תרופות`;
        },
    },
    searchDrugBySymptom: {
        name: 'חיפוש תרופה לפי סימפטום',
        icon: SyringeIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            return 'מחפש תרופות לפי סימפטום...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const drugs = o.drugs as unknown[] | undefined;
            return `נמצאו ${drugs?.length ?? 0} תרופות`;
        },
    },
    exploreGenericAlternatives: {
        name: 'חיפוש חלופות גנריות',
        icon: TagsIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.activeIngredient === 'string') return `מחפש חלופות ל-"${i.activeIngredient}"`;
            return 'מחפש חלופות גנריות...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const drugs = o.drugs as unknown[] | undefined;
            return `נמצאו ${drugs?.length ?? 0} חלופות`;
        },
    },
    exploreTherapeuticCategories: {
        name: 'סריקת קטגוריות טיפוליות',
        icon: ListIcon,
        formatInput: () => 'טוען קטגוריות טיפוליות...',
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const items = o.items as unknown[] | undefined;
            return `נמצאו ${items?.length ?? 0} פריטים`;
        },
    },
    browseSymptoms: {
        name: 'סריקת סימפטומים',
        icon: ListIcon,
        formatInput: () => 'טוען רשימת סימפטומים...',
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const categories = o.categories as unknown[] | undefined;
            return `נמצאו ${categories?.length ?? 0} קטגוריות`;
        },
    },
    getDrugDetails: {
        name: 'שליפת פרטי תרופה',
        icon: PillIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            return 'שולף פרטי תרופה...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            if (typeof o.hebrewName === 'string') return o.hebrewName;
            return 'הושלם';
        },
    },
    suggestDrugNames: {
        name: 'השלמה אוטומטית לתרופות',
        icon: TextSearchIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.query === 'string') return `מחפש: "${i.query}"`;
            return 'מחפש הצעות...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const suggestions = o.suggestions as unknown[] | undefined;
            return `${suggestions?.length ?? 0} הצעות`;
        },
    },
    generateDrugsSourceUrl: {
        name: 'יצירת קישור למקור תרופות',
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
