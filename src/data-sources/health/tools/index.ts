/**
 * Unified Health Tools
 *
 * Aggregates tools from both sub-domains (drugs + overview-data)
 * into a single HealthTools object with merged source configs and resolvers.
 */

import type { ToolSourceConfig, ToolSourceResolver } from '@/data-sources/types';

import { DrugsTools, drugsSourceResolvers } from './drugs';
import { HealthTools as OverviewDataTools, overviewDataSourceConfigs } from './overview-data';

// ============================================================================
// Merged tool object
// ============================================================================

/** All Health tools (drugs + overview-data) as a single object */
export const HealthTools = {
    ...DrugsTools,
    ...OverviewDataTools,
};

/** Union of all Health tool names */
export type HealthToolName = keyof typeof HealthTools;

// ============================================================================
// Merged source URL configs and resolvers
// ============================================================================

/** Declarative source configs for Health tools (overview-data) */
export const healthSourceConfigs: Partial<Record<HealthToolName, ToolSourceConfig>> = {
    ...overviewDataSourceConfigs,
};

/** Custom source resolvers for Health tools (drugs — tool-specific field access) */
export const healthSourceResolvers: Partial<Record<HealthToolName, ToolSourceResolver>> = {
    ...drugsSourceResolvers,
};

// Re-export sub-domain tools for direct access
export { DrugsTools, type DrugsToolName, drugsSourceResolvers } from './drugs';
export {
    HealthTools as OverviewDataTools,
    type HealthToolName as OverviewDataToolName,
    overviewDataSourceConfigs,
} from './overview-data';
