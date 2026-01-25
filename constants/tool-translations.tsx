/**
 * Tool Translations
 *
 * Hebrew translations and formatters for AI SDK tools displayed in the UI.
 * This provides human-readable descriptions of tool inputs and outputs.
 */

import {
  SearchIcon,
  FileTextIcon,
  FolderIcon,
  TagIcon,
  DatabaseIcon,
  BuildingIcon,
  ActivityIcon,
  FileIcon,
  ServerIcon,
  ListIcon,
  ScrollTextIcon,
} from 'lucide-react';
import type {
  ToolName,
  ToolInput,
  ToolOutput,
} from '@/lib/tools/types';

/**
 * Translate common field names to Hebrew
 */
export const fieldTranslations: Record<string, string> = {
  package_count: 'מספר מאגרים',
  name: 'שם',
  title: 'כותרת',
  created: 'תאריך יצירה',
  modified: 'תאריך עדכון',
  metadata_modified: 'תאריך עדכון',
  metadata_created: 'תאריך יצירה',
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

/**
 * Translate sort direction to Hebrew
 */
export function translateSortDirection(dir: string): string {
  const normalized = dir.toLowerCase().trim();
  if (normalized === 'desc' || normalized === 'descending') {
    return 'יורד';
  }
  if (normalized === 'asc' || normalized === 'ascending') {
    return 'עולה';
  }
  return dir;
}

/**
 * Translate a sort string like "package_count desc" to Hebrew
 */
export function translateSort(sort: string): string {
  if (!sort) return '';

  // Handle multiple sort fields separated by comma
  const parts = sort.split(',').map(part => {
    const trimmed = part.trim();
    const [field, direction] = trimmed.split(/\s+/);

    const hebrewField = fieldTranslations[field] || field;
    const hebrewDir = direction ? translateSortDirection(direction) : '';

    return hebrewDir ? `${hebrewField} (${hebrewDir})` : hebrewField;
  });

  return parts.join(', ');
}

/**
 * Type-safe tool translation metadata
 */
export interface ToolTranslation<T extends ToolName> {
  name: string;
  icon: React.ReactNode;
  formatInput: (input: ToolInput<T>) => string;
  formatOutput: (output: ToolOutput<T>) => string;
}

export type ToolTranslationsMap = {
  [K in ToolName]?: ToolTranslation<K>;
};

export const toolTranslations: ToolTranslationsMap = {
  searchDatasets: {
    name: 'חיפוש מאגרי מידע',
    icon: <SearchIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = [];
      if (input.query) {
        parts.push(`מחפש: "${input.query}"`);
      } else {
        parts.push('מציג את כל המאגרים');
      }
      if (input.limit) {
        parts.push(`עד ${input.limit} תוצאות`);
      }
      if (input.organization) {
        parts.push(`ארגון: ${input.organization}`);
      }
      if (input.tag) {
        parts.push(`תגית: ${input.tag}`);
      }
      return parts.join(' • ');
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      if (output.count === 0) {
        return 'לא נמצאו מאגרים';
      }
      return `נמצאו ${output.count} מאגרים`;
    },
  },
  getDatasetDetails: {
    name: 'טוען פרטי מאגר',
    icon: <FileTextIcon className="h-4 w-4" />,
    formatInput: () => {
      return 'טוען פרטים מלאים...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const resourceCount = output.dataset.resources?.length || 0;
      const title = output.dataset.title || 'מאגר';
      return `${title} • ${resourceCount} קבצים`;
    },
  },
  listGroups: {
    name: 'רשימת קבוצות',
    icon: <FolderIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = ['מציג קבוצות נושאים'];
      if (input.limit) {
        parts.push(`עד ${input.limit} תוצאות`);
      }
      if (input.orderBy) {
        parts.push(`ממוין לפי ${translateSort(input.orderBy)}`);
      }
      return parts.join(' • ');
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const count = output.groups?.length || 0;
      return count === 0 ? 'לא נמצאו קבוצות' : `נמצאו ${count} קבוצות`;
    },
  },
  listTags: {
    name: 'רשימת תגיות',
    icon: <TagIcon className="h-4 w-4" />,
    formatInput: (input) => {
      if (input.query) {
        return `מחפש תגיות: "${input.query}"`;
      }
      return 'מציג את כל התגיות';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const count = output.tags?.length || 0;
      return count === 0 ? 'לא נמצאו תגיות' : `נמצאו ${count} תגיות`;
    },
  },
  queryDatastoreResource: {
    name: 'שליפת נתונים',
    icon: <DatabaseIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = [];

      if (input.q) {
        parts.push(`מחפש: "${input.q}"`);
      }

      if (input.filters && typeof input.filters === 'object') {
        const filterEntries = Object.entries(input.filters);
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

      if (input.limit) {
        parts.push(`עד ${input.limit} רשומות`);
      }

      if (input.sort) {
        parts.push(`ממוין לפי ${translateSort(input.sort)}`);
      }

      if (parts.length === 0) {
        parts.push('שולף נתונים מהמאגר');
      }

      return parts.join(' • ');
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const recordCount = output.records?.length || 0;

      if (output.total === 0) {
        return 'לא נמצאו רשומות';
      }

      if (recordCount === output.total) {
        return `נמצאו ${output.total} רשומות`;
      }

      return `מציג ${recordCount} מתוך ${output.total} רשומות`;
    },
  },
  getDatasetActivity: {
    name: 'היסטוריית מאגר',
    icon: <ActivityIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = ['טוען היסטוריית שינויים'];
      if (input.limit) {
        parts.push(`עד ${input.limit} פעילויות`);
      }
      return parts.join(' • ');
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const count = output.activities?.length || 0;
      return count === 0 ? 'לא נמצאו פעילויות' : `נמצאו ${count} פעילויות`;
    },
  },
  getDatasetSchema: {
    name: 'סכמת מאגר',
    icon: <ScrollTextIcon className="h-4 w-4" />,
    formatInput: (input) => {
      return `טוען סכמה: ${input.type || 'dataset'}`;
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const fieldCount = output.schema.datasetFields?.length || 0;
      return `נטענה סכמה עם ${fieldCount} שדות`;
    },
  },
  getOrganizationActivity: {
    name: 'היסטוריית ארגון',
    icon: <ActivityIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = ['טוען פעילות ארגון'];
      if (input.limit) {
        parts.push(`עד ${input.limit} פעילויות`);
      }
      return parts.join(' • ');
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const count = output.activities?.length || 0;
      return count === 0 ? 'לא נמצאו פעילויות' : `נמצאו ${count} פעילויות`;
    },
  },
  getOrganizationDetails: {
    name: 'פרטי ארגון',
    icon: <BuildingIcon className="h-4 w-4" />,
    formatInput: () => {
      return 'טוען פרטי ארגון...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const title = output.organization.title || output.organization.name;
      const count = output.organization.packageCount;
      return `${title} • ${count} מאגרים`;
    },
  },
  getResourceDetails: {
    name: 'פרטי קובץ',
    icon: <FileIcon className="h-4 w-4" />,
    formatInput: () => {
      return 'טוען פרטי קובץ...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const name = output.resource.name;
      const format = output.resource.format;
      return `${name} (${format})`;
    },
  },
  getStatus: {
    name: 'סטטוס מערכת',
    icon: <ServerIcon className="h-4 w-4" />,
    formatInput: () => {
      return 'בודק סטטוס מערכת...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      return `CKAN ${output.status.ckanVersion}`;
    },
  },
  listAllDatasets: {
    name: 'רשימת כל המאגרים',
    icon: <ListIcon className="h-4 w-4" />,
    formatInput: () => {
      return 'טוען רשימת כל המאגרים...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      return `נמצאו ${output.count} מאגרים`;
    },
  },
  listLicenses: {
    name: 'רשימת רישיונות',
    icon: <ScrollTextIcon className="h-4 w-4" />,
    formatInput: () => {
      return 'טוען רשימת רישיונות...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const count = output.licenses?.length || 0;
      return `נמצאו ${count} רישיונות`;
    },
  },
  listOrganizations: {
    name: 'רשימת ארגונים',
    icon: <BuildingIcon className="h-4 w-4" />,
    formatInput: () => {
      return 'טוען רשימת ארגונים...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      return `נמצאו ${output.count} ארגונים`;
    },
  },
  searchResources: {
    name: 'חיפוש קבצים',
    icon: <SearchIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = [];
      if (input.query) {
        parts.push(`מחפש: "${input.query}"`);
      }
      if (input.format) {
        parts.push(`פורמט: ${input.format}`);
      }
      if (input.limit) {
        parts.push(`עד ${input.limit} תוצאות`);
      }
      return parts.length > 0 ? parts.join(' • ') : 'מחפש קבצים...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      if (output.count === 0) {
        return 'לא נמצאו קבצים';
      }
      return `נמצאו ${output.count} קבצים`;
    },
  },
};
