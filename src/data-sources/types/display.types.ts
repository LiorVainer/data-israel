/**
 * Display Types
 *
 * UI display metadata for agents and data source badges.
 */

import type { LucideIcon } from 'lucide-react';

/** Data source identifier */
export type DataSource = 'cbs' | 'datagov' | 'budget' | 'knesset' | 'nadlan' | 'drugs' | 'health' | 'grocery';

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

/** Landing page category groups — single source of truth */
export const LANDING_CATEGORIES = {
    government: { label: 'ממשל ותקציב', order: 1 },
    economy: { label: 'כלכלה ונדל"ן', order: 2 },
    health: { label: 'בריאות', order: 3 },
} as const;

/** Valid landing page category */
export type LandingCategory = keyof typeof LANDING_CATEGORIES;

/** Landing page display config for a data source */
export interface LandingConfig {
    /** Path to logo SVG in /public */
    logo: string;
    /** Hebrew one-liner description */
    description: string;
    /** Up to 3 stat items */
    stats: { label: string; value: string; icon: LucideIcon }[];
    /** Which category tab this source appears under */
    category: LandingCategory;
    /** Sort order within category */
    order: number;
}
