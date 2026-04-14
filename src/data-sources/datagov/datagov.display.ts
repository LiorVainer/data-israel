/**
 * DataGov Display Configuration
 *
 * Agent display metadata and badge configuration for data.gov.il data source.
 */

import { DatabaseIcon } from 'lucide-react';
import type { AgentDisplayInfo, DataSourceConfig } from '@/data-sources/types';

/** Agent display info for the DataGov agent in ChainOfThought UI */
export const datagovAgentDisplay: AgentDisplayInfo = {
    label: 'מידע ממשלתי',
    icon: DatabaseIcon,
    dataSource: 'datagov',
};

/** Badge configuration for DataGov data source attribution */
export const datagovBadgeConfig: DataSourceConfig = {
    urlLabel: 'data.gov.il',
    nameLabel: 'מידע ממשלתי',
    url: 'https://data.gov.il',
    className: 'bg-[var(--badge-datagov)] text-[var(--badge-datagov-foreground)] hover:bg-[var(--badge-datagov)]/80',
};
