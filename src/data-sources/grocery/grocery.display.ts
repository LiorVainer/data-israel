/**
 * Grocery Display Configuration
 *
 * Agent display metadata and badge configuration for grocery data source.
 */

import { ShoppingCartIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** Grocery agent display label (Hebrew) */
export const groceryDisplayLabel = 'בודק מחירי מזון בסופרמרקטים';

/** Grocery agent display icon */
export const groceryDisplayIcon = ShoppingCartIcon;

/** Grocery badge configuration for data source attribution */
export const groceryBadgeConfig: DataSourceConfig = {
    urlLabel: 'מחירי מזון',
    nameLabel: 'מחירי מזון',
    url: 'https://prices.shufersal.co.il',
    className: 'bg-[var(--badge-grocery)] text-[var(--badge-grocery-foreground)] hover:bg-[var(--badge-grocery)]/80',
};
