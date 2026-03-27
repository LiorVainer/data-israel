/**
 * Shufersal Tool Translations
 *
 * Hebrew translations and icons for Shufersal tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import { LinkIcon, ShoppingCartIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { ShufersalToolName } from './tools';

export const shufersalTranslations: Partial<Record<ShufersalToolName, ToolTranslation>> = {
    searchShufersalProducts: {
        name: 'חיפוש מוצרים בשופרסל',
        icon: ShoppingCartIcon,
    },
    generateShufersalSourceUrl: {
        name: 'יצירת קישור לשופרסל',
        icon: LinkIcon,
    },
};
