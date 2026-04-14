/**
 * Shufersal Display Configuration
 *
 * Agent display metadata and badge configuration for the Shufersal data source.
 */

import { ShoppingCartIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** Shufersal agent display label (Hebrew) */
export const shufersalDisplayLabel = 'שופרסל';

/** Shufersal agent display icon */
export const shufersalDisplayIcon = ShoppingCartIcon;

/** Shufersal badge configuration for data source attribution */
export const shufersalBadgeConfig: DataSourceConfig = {
    urlLabel: 'shufersal.co.il',
    nameLabel: 'שופרסל',
    url: 'https://www.shufersal.co.il',
    className:
        'bg-[var(--badge-shufersal)] text-[var(--badge-shufersal-foreground)] hover:bg-[var(--badge-shufersal)]/80',
};
