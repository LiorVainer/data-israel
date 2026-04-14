/**
 * Shufersal Tool Translations
 *
 * Hebrew translations and icons for Shufersal tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import { ShoppingCartIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { ShufersalToolName } from './tools';

export const shufersalTranslations = {
    searchShufersalProducts: {
        name: 'חיפוש מוצרים בשופרסל',
        icon: ShoppingCartIcon,
    },
} satisfies Partial<Record<ShufersalToolName, ToolTranslation>>;
