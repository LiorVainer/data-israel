/**
 * CBS Display Configuration
 *
 * Agent display metadata and badge configuration for CBS data source.
 */

import { BarChart2Icon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** CBS agent display label (Hebrew) */
export const cbsDisplayLabel = 'בודק בנתוני הלשכה המרכזית לסטטיסטיקה';

/** CBS agent display icon */
export const cbsDisplayIcon = BarChart2Icon;

/** CBS badge configuration for data source attribution */
export const cbsBadgeConfig: DataSourceConfig = {
    urlLabel: 'cbs.gov.il',
    nameLabel: 'למ"ס',
    url: 'https://www.cbs.gov.il',
    className: 'bg-[var(--badge-cbs)] text-[var(--badge-cbs-foreground)] hover:bg-[var(--badge-cbs)]/80',
};
