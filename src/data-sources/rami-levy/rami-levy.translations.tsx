/**
 * Rami Levy Tool Translations
 *
 * Hebrew translations and icons for Rami Levy tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import { SearchIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { RamiLevyToolName } from './tools';

export const ramiLevyTranslations: Partial<Record<RamiLevyToolName, ToolTranslation>> = {
    searchRamiLevyProducts: {
        name: 'חיפוש מוצרים ברמי לוי',
        icon: SearchIcon,
    },
};
