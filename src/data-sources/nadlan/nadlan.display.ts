/**
 * Nadlan Display Configuration
 *
 * Agent display metadata and badge configuration for the Nadlan data source.
 */

import { HomeIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** Nadlan agent display label (Hebrew) */
export const nadlanDisplayLabel = 'בודק בנתוני עסקאות נדל"ן';

/** Nadlan agent display icon */
export const nadlanDisplayIcon = HomeIcon;

/** Nadlan badge configuration for data source attribution */
export const nadlanBadgeConfig: DataSourceConfig = {
    urlLabel: 'govmap.gov.il',
    nameLabel: 'נדל"ן',
    url: 'https://www.govmap.gov.il',
    className: 'bg-[var(--badge-nadlan)] text-[var(--badge-nadlan-foreground)] hover:bg-[var(--badge-nadlan)]/80',
};
