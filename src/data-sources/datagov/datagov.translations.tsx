/**
 * DataGov Tool Translations
 *
 * Hebrew translations and formatters for DataGov AI SDK tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import {
    ActivityIcon,
    BuildingIcon,
    DatabaseIcon,
    FileIcon,
    FileTextIcon,
    FolderIcon,
    LinkIcon,
    ListIcon,
    ScrollTextIcon,
    SearchIcon,
    ServerIcon,
    TagIcon,
} from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { DataGovToolName } from './tools';

/**
 * Translate common field names to Hebrew
 */
const fieldTranslations: Record<string, string> = {
    package_count: 'מספר מאגרים',
    name: 'שם',
    title: 'כותרת',
    created: 'תאריך יצירה',
    modified: 'תאריך עדכון',
    metadata_modified: 'תאריך עדכון מטא-דאטה',
    metadata_created: 'תאריך יצירה',
    lastUpdated: 'תאריך עדכון נתונים',
    score: 'רלוונטיות',
    popularity: 'פופולריות',
    views: 'צפיות',
    downloads: 'הורדות',
    size: 'גודל',
    year: 'שנה',
    date: 'תאריך',
    city: 'עיר',
    population: 'אוכלוסייה',
    price: 'מחיר',
    count: 'כמות',
};

function translateSortDirection(dir: string): string {
    const normalized = dir.toLowerCase().trim();
    if (normalized === 'desc' || normalized === 'descending') return 'יורד';
    if (normalized === 'asc' || normalized === 'ascending') return 'עולה';
    return dir;
}

function translateSort(sort: string): string {
    if (!sort) return '';
    const parts = sort.split(',').map((part) => {
        const trimmed = part.trim();
        const [field, direction] = trimmed.split(/\s+/);
        const hebrewField = fieldTranslations[field] || field;
        const hebrewDir = direction ? translateSortDirection(direction) : '';
        return hebrewDir ? `${hebrewField} (${hebrewDir})` : hebrewField;
    });
    return parts.join(', ');
}

function getString(obj: unknown, key: string): string | undefined {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === 'string' ? val : undefined;
}

function getNumber(obj: unknown, key: string): number | undefined {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === 'number' ? val : undefined;
}

function getArray(obj: unknown, key: string): unknown[] | undefined {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const val = (obj as Record<string, unknown>)[key];
    return Array.isArray(val) ? val : undefined;
}

function getRecord(obj: unknown, key: string): Record<string, unknown> | undefined {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === 'object' && val !== null && !Array.isArray(val)
        ? (val as Record<string, unknown>)
        : undefined;
}

export const datagovTranslations: Partial<Record<DataGovToolName, ToolTranslation>> = {
    searchDatasets: {
        name: 'חיפוש מאגרי מידע',
        icon: SearchIcon,
        formatInput: (input) => {
            const resourceName = getString(input, 'searchedResourceName');
            if (resourceName) return resourceName;
            const parts: string[] = [];
            const query = getString(input, 'query');
            if (query) {
                parts.push(`מחפש: "${query}"`);
            } else {
                parts.push('מציג את כל המאגרים');
            }
            const limit = getNumber(input, 'limit');
            if (limit) parts.push(`עד ${limit} תוצאות`);
            const organization = getString(input, 'organization');
            if (organization) parts.push(`ארגון: ${organization}`);
            const tag = getString(input, 'tag');
            if (tag) parts.push(`תגית: ${tag}`);
            return parts.join(' • ');
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const count = getNumber(output, 'count');
            if (count === 0) return 'לא נמצאו מאגרים';
            return `נמצאו ${count} מאגרים`;
        },
    },
    getDatasetDetails: {
        name: 'טוען פרטי מאגר',
        icon: FileTextIcon,
        formatInput: () => undefined,
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const dataset = getRecord(output, 'dataset');
            const resourceCount = getArray(dataset, 'resources')?.length || 0;
            const title = getString(dataset, 'title') || 'מאגר';
            return `${title} • ${resourceCount} קבצים`;
        },
    },
    listGroups: {
        name: 'רשימת קבוצות',
        icon: FolderIcon,
        formatInput: (input) => {
            const resourceName = getString(input, 'searchedResourceName');
            if (resourceName) return resourceName;
            const parts: string[] = ['מציג קבוצות נושאים'];
            const limit = getNumber(input, 'limit');
            if (limit) parts.push(`עד ${limit} תוצאות`);
            const orderBy = getString(input, 'orderBy');
            if (orderBy) parts.push(`ממוין לפי ${translateSort(orderBy)}`);
            return parts.join(' • ');
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const count = getArray(output, 'groups')?.length || 0;
            return count === 0 ? 'לא נמצאו קבוצות' : `נמצאו ${count} קבוצות`;
        },
    },
    listTags: {
        name: 'רשימת תגיות',
        icon: TagIcon,
        formatInput: (input) => {
            const resourceName = getString(input, 'searchedResourceName');
            if (resourceName) return resourceName;
            const query = getString(input, 'query');
            if (query) return `מחפש תגיות: "${query}"`;
            return 'מציג את כל התגיות';
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const count = getArray(output, 'tags')?.length || 0;
            return count === 0 ? 'לא נמצאו תגיות' : `נמצאו ${count} תגיות`;
        },
    },
    queryDatastoreResource: {
        name: 'שליפת נתונים',
        icon: DatabaseIcon,
        formatInput: (input) => {
            const parts: string[] = [];
            const q = getString(input, 'q');
            if (q) parts.push(`מחפש: "${q}"`);
            const filters = getRecord(input, 'filters');
            if (filters) {
                const filterEntries = Object.entries(filters);
                if (filterEntries.length > 0) {
                    const filterStr = filterEntries
                        .map(([key, value]) => {
                            const hebrewKey = fieldTranslations[key] || key;
                            return `${hebrewKey}="${value}"`;
                        })
                        .join(', ');
                    parts.push(`מסנן לפי: ${filterStr}`);
                }
            }
            const limit = getNumber(input, 'limit');
            if (limit) parts.push(`שולף את ה-${limit} רשומות המתאימות ביותר `);
            const sort = getString(input, 'sort');
            if (sort) parts.push(`ממוין לפי ${translateSort(sort)}`);
            if (parts.length === 0) parts.push('שולף נתונים מהמאגר');
            return parts.join(' • ');
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const recordCount = getArray(output, 'records')?.length || 0;
            const total = getNumber(output, 'total');
            if (total === 0) return 'לא נמצאו רשומות';
            return `נשלפו ${recordCount} רשומות`;
        },
    },
    getDatasetActivity: {
        name: 'היסטוריית מאגר',
        icon: ActivityIcon,
        formatInput: (input) => {
            const parts: string[] = ['טוען היסטוריית שינויים'];
            const limit = getNumber(input, 'limit');
            if (limit) parts.push(`עד ${limit} פעילויות`);
            return parts.join(' • ');
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const count = getArray(output, 'activities')?.length || 0;
            return count === 0 ? 'לא נמצאו פעילויות' : `נמצאו ${count} פעילויות`;
        },
    },
    getDatasetSchema: {
        name: 'סכמת מאגר',
        icon: ScrollTextIcon,
        formatInput: (input) => {
            return `טוען סכמה: ${getString(input, 'type') || 'dataset'}`;
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const schema = getRecord(output, 'schema');
            const fieldCount = getArray(schema, 'datasetFields')?.length || 0;
            return `נטענה סכמה עם ${fieldCount} שדות`;
        },
    },
    getOrganizationActivity: {
        name: 'היסטוריית ארגון',
        icon: ActivityIcon,
        formatInput: (input) => {
            const parts: string[] = ['טוען פעילות ארגון'];
            const limit = getNumber(input, 'limit');
            if (limit) parts.push(`עד ${limit} פעילויות`);
            return parts.join(' • ');
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const count = getArray(output, 'activities')?.length || 0;
            return count === 0 ? 'לא נמצאו פעילויות' : `נמצאו ${count} פעילויות`;
        },
    },
    getOrganizationDetails: {
        name: 'פרטי ארגון',
        icon: BuildingIcon,
        formatInput: () => 'טוען פרטי ארגון...',
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const org = getRecord(output, 'organization');
            const title = getString(org, 'title') || getString(org, 'name');
            const count = getNumber(org, 'packageCount');
            return `${title} • ${count} מאגרים`;
        },
    },
    getResourceDetails: {
        name: 'פרטי קובץ',
        icon: FileIcon,
        formatInput: () => 'טוען פרטי קובץ...',
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const resource = getRecord(output, 'resource');
            const name = getString(resource, 'name');
            const format = getString(resource, 'format');
            return `${name} (${format})`;
        },
    },
    getStatus: {
        name: 'סטטוס מערכת',
        icon: ServerIcon,
        formatInput: () => 'בודק סטטוס מערכת...',
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const status = getRecord(output, 'status');
            return `CKAN ${getString(status, 'ckanVersion')}`;
        },
    },
    listAllDatasets: {
        name: 'רשימת כל המאגרים',
        icon: ListIcon,
        formatInput: (input) => {
            const resourceName = getString(input, 'searchedResourceName');
            if (resourceName) return resourceName;
            return 'טוען רשימת כל המאגרים...';
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            return `נמצאו ${getNumber(output, 'count')} מאגרים`;
        },
    },
    listLicenses: {
        name: 'רשימת רישיונות',
        icon: ScrollTextIcon,
        formatInput: () => 'טוען רשימת רישיונות...',
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const count = getArray(output, 'licenses')?.length || 0;
            return `נמצאו ${count} רישיונות`;
        },
    },
    listOrganizations: {
        name: 'רשימת ארגונים',
        icon: BuildingIcon,
        formatInput: (input) => {
            const resourceName = getString(input, 'searchedResourceName');
            if (resourceName) return resourceName;
            return 'טוען רשימת ארגונים...';
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            return `נמצאו ${getNumber(output, 'count')} ארגונים`;
        },
    },
    searchResources: {
        name: 'חיפוש קבצים',
        icon: SearchIcon,
        formatInput: (input) => {
            const resourceName = getString(input, 'searchedResourceName');
            if (resourceName) return resourceName;
            const parts: string[] = [];
            const query = getString(input, 'query');
            if (query) parts.push(`מחפש: "${query}"`);
            const format = getString(input, 'format');
            if (format) parts.push(`פורמט: ${format}`);
            const limit = getNumber(input, 'limit');
            if (limit) parts.push(`עד ${limit} תוצאות`);
            return parts.length > 0 ? parts.join(' • ') : 'מחפש קבצים...';
        },
        formatOutput: (output) => {
            if (getString(output, 'error')) return `שגיאה: ${getString(output, 'error')}`;
            const count = getNumber(output, 'count');
            if (count === 0) return 'לא נמצאו קבצים';
            return `נמצאו ${count} קבצים`;
        },
    },
    generateDataGovSourceUrl: {
        name: 'יצירת קישור למקור ממשלתי',
        icon: LinkIcon,
        formatInput: (input) => {
            const title = getString(input, 'title');
            if (title) return `יוצר קישור: "${title}"`;
            return 'יוצר קישור למקור...';
        },
        formatOutput: (output) => {
            const title = getString(output, 'title');
            return title ?? undefined;
        },
    },
};
