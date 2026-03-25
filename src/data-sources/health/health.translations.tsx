/**
 * Health Tool Translations
 *
 * Hebrew translations and formatters for health tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import { DatabaseIcon, FileTextIcon, HeartPulseIcon, LinkIcon, ListIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { HealthToolName } from './tools';

export const healthTranslations: Partial<Record<HealthToolName, ToolTranslation>> = {
    getAvailableSubjects: {
        name: 'סריקת נושאי בריאות',
        icon: ListIcon,
        formatInput: () => 'טוען נושאי בריאות זמינים...',
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const subjects = o.subjects as unknown[] | undefined;
            return `${subjects?.length ?? 0} נושאים זמינים`;
        },
    },
    getHealthMetadata: {
        name: 'שליפת מטא-דאטה',
        icon: DatabaseIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.subject === 'string') return `טוען מטא-דאטה: "${i.subject}"`;
            return 'טוען מטא-דאטה...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const totalEndpoints = o.totalEndpoints as number | undefined;
            return `${totalEndpoints ?? 0} נקודות נתונים`;
        },
    },
    getHealthData: {
        name: 'שליפת נתוני בריאות',
        icon: HeartPulseIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.endPointName === 'string') return `שולף: "${i.endPointName}"`;
            return 'שולף נתוני בריאות...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const recordCount = o.recordCount as number | undefined;
            return `נשלפו ${recordCount ?? 0} רשומות`;
        },
    },
    getHealthLinks: {
        name: 'שליפת קישורים',
        icon: FileTextIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            return 'טוען קישורים...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const links = o.links as unknown[] | undefined;
            return `${links?.length ?? 0} קישורים`;
        },
    },
    generateHealthSourceUrl: {
        name: 'יצירת קישור למקור בריאות',
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
