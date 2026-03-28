/**
 * Drugs Display Configuration
 *
 * Agent display metadata and badge configuration for the drugs data source.
 */

import { PillIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** Drugs agent display label (Hebrew) */
export const drugsDisplayLabel = 'מאגר התרופות';

/** Drugs agent display icon */
export const drugsDisplayIcon = PillIcon;

/** Drugs badge configuration for data source attribution */
export const drugsBadgeConfig: DataSourceConfig = {
    urlLabel: 'israeldrugs.health.gov.il',
    nameLabel: 'תרופות',
    url: 'https://israeldrugs.health.gov.il',
    className: 'bg-[var(--badge-drugs)] text-[var(--badge-drugs-foreground)] hover:bg-[var(--badge-drugs)]/80',
};
