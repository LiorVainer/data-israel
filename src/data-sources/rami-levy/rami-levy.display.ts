/**
 * Rami Levy Display Configuration
 *
 * Agent display metadata and badge configuration for the Rami Levy data source.
 */

import { ShoppingCartIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** Rami Levy agent display label (Hebrew) */
export const ramiLevyDisplayLabel = 'בודק מחירים ברמי לוי';

/** Rami Levy agent display icon */
export const ramiLevyDisplayIcon = ShoppingCartIcon;

/** Rami Levy badge configuration for data source attribution */
export const ramiLevyBadgeConfig: DataSourceConfig = {
    urlLabel: 'rami-levy.co.il',
    nameLabel: 'רמי לוי',
    url: 'https://www.rami-levy.co.il',
    className:
        'bg-[var(--badge-rami-levy)] text-[var(--badge-rami-levy-foreground)] hover:bg-[var(--badge-rami-levy)]/80',
};
