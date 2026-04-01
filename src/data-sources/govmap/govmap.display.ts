/**
 * GovMap Display Configuration
 *
 * Agent display metadata and badge configuration for the GovMap data source.
 */

import { MapIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** GovMap agent display label */
export const govmapDisplayLabel = 'GovMap';

/** GovMap agent display icon */
export const govmapDisplayIcon = MapIcon;

/** GovMap badge configuration for data source attribution */
export const govmapBadgeConfig: DataSourceConfig = {
    urlLabel: 'govmap.gov.il',
    nameLabel: 'GovMap',
    url: 'https://www.govmap.gov.il',
    className: 'bg-[var(--badge-govmap)] text-[var(--badge-govmap-foreground)] hover:bg-[var(--badge-govmap)]/80',
};
