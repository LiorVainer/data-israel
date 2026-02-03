/**
 * Tool Data Source Configuration
 *
 * Maps tool names to their external data source for badge display.
 * Uses the existing CbsTools and DataGovTools constants.
 */

import { CbsTools } from '@/lib/tools/cbs';
import { DataGovTools } from '@/lib/tools/datagov';

/** Data source types */
export type DataSource = 'cbs' | 'datagov';

/** Data source configuration */
export interface DataSourceConfig {
    urlLabel: string;
    url: string;
    nameLabel: string;
    /** Tailwind classes for badge styling */
    className: string;
}

/** Configuration for each data source */
export const DATA_SOURCE_CONFIG = {
    cbs: {
        urlLabel: 'cbs.gov.il',
        nameLabel: 'למ"ס',
        url: 'https://www.cbs.gov.il',
        className: 'bg-[var(--badge-cbs)] text-[var(--badge-cbs-foreground)] hover:bg-[var(--badge-cbs)]/80',
    },
    datagov: {
        urlLabel: 'data.gov.il',
        nameLabel: 'מידע ממשלתי',
        url: 'https://data.gov.il',
        className:
            'bg-[var(--badge-datagov)] text-[var(--badge-datagov-foreground)] hover:bg-[var(--badge-datagov)]/80',
    },
} satisfies Record<DataSource, DataSourceConfig>;

/** Set of CBS tool names */
const CBS_TOOL_NAMES = new Set(Object.keys(CbsTools));

/** Set of DataGov tool names */
const DATAGOV_TOOL_NAMES = new Set(Object.keys(DataGovTools));

/**
 * Get the data source for a tool by its key
 * @param toolKey - The tool key (without 'tool-' prefix)
 * @returns The data source or undefined for unknown/internal tools
 */
export function getToolDataSource(toolKey: string): DataSource | undefined {
    if (CBS_TOOL_NAMES.has(toolKey)) {
        return 'cbs';
    }
    if (DATAGOV_TOOL_NAMES.has(toolKey)) {
        return 'datagov';
    }
    return undefined;
}

/**
 * Get the data source configuration for a tool
 * @param toolKey - The tool key (without 'tool-' prefix)
 * @returns The data source config or undefined
 */
export function getToolDataSourceConfig(toolKey: string): DataSourceConfig | undefined {
    const source = getToolDataSource(toolKey);
    return source ? DATA_SOURCE_CONFIG[source] : undefined;
}
