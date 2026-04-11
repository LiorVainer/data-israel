/**
 * Knesset Display Configuration
 *
 * Agent display metadata and badge configuration for the Knesset data source.
 */

import { LandmarkIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** Knesset agent display label (Hebrew) */
export const knessetDisplayLabel = 'הכנסת';

/** Knesset agent display icon */
export const knessetDisplayIcon = LandmarkIcon;

/** Knesset badge configuration for data source attribution */
export const knessetBadgeConfig: DataSourceConfig = {
    urlLabel: 'knesset.gov.il',
    nameLabel: 'הכנסת',
    url: 'https://main.knesset.gov.il',
    className: 'bg-[var(--badge-knesset)] text-[var(--badge-knesset-foreground)] hover:bg-[var(--badge-knesset)]/80',
};
