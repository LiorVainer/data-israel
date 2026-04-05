/**
 * IL Health Tools
 *
 * Re-exports all health tools and collects source URL configs.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

// Tool imports
import { getAvailableSubjects } from './get-available-subjects.tool';
import { getHealthMetadata } from './get-health-metadata.tool';
import { getHealthData } from './get-health-data.tool';
import { getHealthLinks } from './get-health-links.tool';

// Re-exports
export { getAvailableSubjects } from './get-available-subjects.tool';
export { getHealthMetadata } from './get-health-metadata.tool';
export { getHealthData } from './get-health-data.tool';
export { getHealthLinks } from './get-health-links.tool';

// ============================================================================
// Collected tool object
// ============================================================================

/** All Health tools as a single object */
export const HealthTools = {
    getAvailableSubjects,
    getHealthMetadata,
    getHealthData,
    getHealthLinks,
};

/** Union of all Health tool names, derived from the HealthTools object */
export type HealthToolName = keyof typeof HealthTools;

// ============================================================================
// Source URL configs (declarative — registry auto-generates resolvers)
// ============================================================================

/** Declarative source configs for Health overview-data tools */
export const overviewDataSourceConfigs: Partial<Record<HealthToolName, ToolSourceConfig>> = {
    getHealthData: { title: 'נתוני בריאות' },
};
