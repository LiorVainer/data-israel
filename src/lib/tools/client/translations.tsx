/**
 * Client Tool Translations
 *
 * Hebrew translations for client-side tools (charts, suggestions).
 * Icons are LucideIcon components (not JSX elements).
 */

import { BarChart2Icon, LineChartIcon, LinkIcon, MapIcon, PieChartIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { ClientToolName } from './index';

export const clientTranslations: Partial<Record<ClientToolName, ToolTranslation>> = {
    displayBarChart: {
        name: 'הצגת תרשים עמודות',
        icon: BarChart2Icon,
    },
    displayLineChart: {
        name: 'הצגת תרשים קו',
        icon: LineChartIcon,
    },
    displayPieChart: {
        name: 'הצגת תרשים עוגה',
        icon: PieChartIcon,
    },
    displayGovmap: {
        name: 'הצגת מפה',
        icon: MapIcon,
    },
    suggestFollowUps: {
        name: 'הצעות המשך',
        icon: LinkIcon,
    },
};
