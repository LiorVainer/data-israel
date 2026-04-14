/**
 * BudgetKey Tool Translations
 *
 * Hebrew translations and icons for BudgetKey MCP tools displayed in the UI.
 * Tool names are MCP-namespaced: `budgetkey_<ToolName>`.
 */

import { CodeIcon, DatabaseIcon, SearchIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { BudgetToolName } from './budget.tools';

export const budgetTranslations: Partial<Record<BudgetToolName, ToolTranslation>> = {
    budgetkey_DatasetInfo: {
        name: 'מידע על מאגר',
        icon: DatabaseIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.dataset === 'string') return `מאגר: ${i.dataset}`;
            return 'טוען מידע על מאגר...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (typeof o === 'object' && o && 'error' in o) return `שגיאה: ${String(o.error)}`;
            return 'מידע על מאגר נטען';
        },
    },
    budgetkey_DatasetFullTextSearch: {
        name: 'חיפוש חופשי בתקציב',
        icon: SearchIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.q === 'string') return `מחפש: "${i.q}"`;
            if (typeof i.dataset === 'string') return `מחפש במאגר: ${i.dataset}`;
            return 'מחפש בנתוני התקציב...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (typeof o === 'object' && o && 'error' in o) return `שגיאה: ${String(o.error)}`;
            const rows = o && typeof o === 'object' && 'rows' in o ? (o.rows as unknown[]) : undefined;
            if (rows) return `נמצאו ${rows.length} תוצאות`;
            return 'החיפוש הושלם';
        },
    },
    budgetkey_DatasetDBQuery: {
        name: 'שאילתת נתונים',
        icon: CodeIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.dataset === 'string') return `שאילתה במאגר: ${i.dataset}`;
            return 'מריץ שאילתה...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (typeof o === 'object' && o && 'error' in o) return `שגיאה: ${String(o.error)}`;
            if (typeof o === 'object' && o && 'warnings' in o) return 'אזהרה — יש לתקן את השאילתה';
            const rows = o && typeof o === 'object' && 'rows' in o ? (o.rows as unknown[]) : undefined;
            if (rows) return `נשלפו ${rows.length} שורות`;
            return 'השאילתה הושלמה';
        },
    },
};
