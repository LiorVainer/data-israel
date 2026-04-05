/**
 * Display Types
 *
 * UI display metadata for agents and data source badges.
 */

import type { LucideIcon } from 'lucide-react';

/** Data source identifier */
export type DataSource = 'cbs' | 'datagov' | 'budget' | 'knesset' | 'govmap' | 'health' | 'shufersal' | 'rami-levy';

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

/** Data source category groups — single source of truth for landing page, suggestions, and picker */
export const DATA_SOURCES_CATEGORIES = {
    general: { label: 'מידע כללי', order: 1 },
    economy: { label: 'כלכלה ותקציב', order: 2 },
    health: { label: 'בריאות', order: 3 },
} as const;

/** Valid data source category */
export type DataSourceCategory = keyof typeof DATA_SOURCES_CATEGORIES;

/** A single example prompt for the empty conversation */
export interface SuggestionPrompt {
    /** Hebrew short label (e.g., "מחירי דירות") */
    label: string;
    /** Full Hebrew prompt text */
    prompt: string;
    /** Card icon */
    icon: LucideIcon;
}

/** Suggestions config for a data source */
export interface SuggestionsConfig {
    /** Override icon for the source in suggestions UI */
    icon?: LucideIcon;
    /** Optional accent color class (e.g., 'text-blue-500') */
    color?: string;
    /** 2-4 example prompts */
    prompts: SuggestionPrompt[];
}

/** Landing page display config for a data source */
export interface LandingConfig {
    /** Path to logo image in /public — when omitted, SourceCard falls back to the display icon */
    logo?: string;
    /** Hebrew one-liner description */
    description: string;
    /** Up to 3 stat items */
    stats: { label: string; value: string; icon: LucideIcon }[];
    /** Which category tab this source appears under */
    category: DataSourceCategory;
    /** Sort order within category */
    order: number;
}
