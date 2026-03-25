/**
 * DataGov Tool Translations
 *
 * Hebrew translations for DataGov AI SDK tools displayed in the UI.
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

export const datagovTranslations: Partial<Record<DataGovToolName, ToolTranslation>> = {
    searchDatasets: {
        name: 'חיפוש מאגרי מידע',
        icon: SearchIcon,
    },
    getDatasetDetails: {
        name: 'טוען פרטי מאגר',
        icon: FileTextIcon,
    },
    listGroups: {
        name: 'רשימת קבוצות',
        icon: FolderIcon,
    },
    listTags: {
        name: 'רשימת תגיות',
        icon: TagIcon,
    },
    queryDatastoreResource: {
        name: 'שליפת נתונים',
        icon: DatabaseIcon,
    },
    getDatasetActivity: {
        name: 'היסטוריית מאגר',
        icon: ActivityIcon,
    },
    getDatasetSchema: {
        name: 'סכמת מאגר',
        icon: ScrollTextIcon,
    },
    getOrganizationActivity: {
        name: 'היסטוריית ארגון',
        icon: ActivityIcon,
    },
    getOrganizationDetails: {
        name: 'פרטי ארגון',
        icon: BuildingIcon,
    },
    getResourceDetails: {
        name: 'פרטי קובץ',
        icon: FileIcon,
    },
    getStatus: {
        name: 'סטטוס מערכת',
        icon: ServerIcon,
    },
    listAllDatasets: {
        name: 'רשימת כל המאגרים',
        icon: ListIcon,
    },
    listLicenses: {
        name: 'רשימת רישיונות',
        icon: ScrollTextIcon,
    },
    listOrganizations: {
        name: 'רשימת ארגונים',
        icon: BuildingIcon,
    },
    searchResources: {
        name: 'חיפוש קבצים',
        icon: SearchIcon,
    },
    generateDataGovSourceUrl: {
        name: 'יצירת קישור למקור ממשלתי',
        icon: LinkIcon,
    },
};
