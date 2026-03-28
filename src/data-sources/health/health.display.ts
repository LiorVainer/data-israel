/**
 * Health Display Configuration
 *
 * Agent display metadata and badge configuration for the health data source.
 */

import { HeartPulseIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** Health agent display label (Hebrew) */
export const healthDisplayLabel = 'משרד הבריאות';

/** Health agent display icon */
export const healthDisplayIcon = HeartPulseIcon;

/** Health badge configuration for data source attribution */
export const healthBadgeConfig: DataSourceConfig = {
    urlLabel: 'datadashboard.health.gov.il',
    nameLabel: 'בריאות',
    url: 'https://datadashboard.health.gov.il',
    className: 'bg-[var(--badge-health)] text-[var(--badge-health-foreground)] hover:bg-[var(--badge-health)]/80',
};
