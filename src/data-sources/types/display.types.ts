/**
 * Display Types
 *
 * UI display metadata for agents and data source badges.
 */

import type { LucideIcon } from 'lucide-react';

/** Data source identifier */
export type DataSource = 'cbs' | 'datagov';

/** Badge configuration for data source attribution */
export interface DataSourceConfig {
    urlLabel: string;
    url: string;
    nameLabel: string;
    /** Tailwind classes for badge styling */
    className: string;
}

/** Agent display metadata for ChainOfThought UI */
export interface AgentDisplayInfo {
    label: string;
    icon: LucideIcon;
    /** Data source for badge display — only for data-fetching agents */
    dataSource?: DataSource;
}
