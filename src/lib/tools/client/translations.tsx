/**
 * Client Tool Translations
 *
 * Hebrew translations and formatters for client-side tools (charts, suggestions).
 * Icons are LucideIcon components (not JSX elements).
 */

import { BarChart2Icon, LineChartIcon, LinkIcon, PieChartIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { ClientToolName } from './index';

function getString(obj: unknown, key: string): string | undefined {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === 'string' ? val : undefined;
}

function getBoolean(obj: unknown, key: string): boolean | undefined {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === 'boolean' ? val : undefined;
}

export const clientTranslations: Partial<Record<ClientToolName, ToolTranslation>> = {
    displayBarChart: {
        name: 'הצגת תרשים עמודות',
        icon: BarChart2Icon,
        formatInput: (input) => {
            const title = getString(input, 'title');
            if (title) return `מציג תרשים עמודות: "${title}"`;
            return 'מציג תרשים עמודות';
        },
        formatOutput: (output) => {
            return getBoolean(output, 'rendered') ? 'התרשים הוצג בהצלחה' : 'שגיאה בהצגת התרשים';
        },
    },
    displayLineChart: {
        name: 'הצגת תרשים קו',
        icon: LineChartIcon,
        formatInput: (input) => {
            const title = getString(input, 'title');
            if (title) return `מציג תרשים קו: "${title}"`;
            return 'מציג תרשים קו';
        },
        formatOutput: (output) => {
            return getBoolean(output, 'rendered') ? 'התרשים הוצג בהצלחה' : 'שגיאה בהצגת התרשים';
        },
    },
    displayPieChart: {
        name: 'הצגת תרשים עוגה',
        icon: PieChartIcon,
        formatInput: (input) => {
            const title = getString(input, 'title');
            if (title) return `מציג תרשים עוגה: "${title}"`;
            return 'מציג תרשים עוגה';
        },
        formatOutput: (output) => {
            return getBoolean(output, 'rendered') ? 'התרשים הוצג בהצלחה' : 'שגיאה בהצגת התרשים';
        },
    },
    suggestFollowUps: {
        name: 'הצעות המשך',
        icon: LinkIcon,
        formatInput: () => 'מכין הצעות...',
        formatOutput: () => 'הוצעו הצעות המשך',
    },
};
