/**
 * IL Health Tools
 *
 * Re-exports all health tools and collects source URL resolvers.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Tool imports
import { getAvailableSubjects } from './get-available-subjects.tool';
import { getHealthMetadata } from './get-health-metadata.tool';
import { getHealthData } from './get-health-data.tool';
import { getHealthLinks } from './get-health-links.tool';
import { generateHealthSourceUrl } from './generate-source-url.tool';

// Re-exports
export { getAvailableSubjects } from './get-available-subjects.tool';
export { getHealthMetadata } from './get-health-metadata.tool';
export { getHealthData } from './get-health-data.tool';
export { getHealthLinks } from './get-health-links.tool';
export { generateHealthSourceUrl } from './generate-source-url.tool';

// ============================================================================
// Collected tool object
// ============================================================================

/** All Health tools as a single object */
export const HealthTools = {
    getAvailableSubjects,
    getHealthMetadata,
    getHealthData,
    getHealthLinks,
    generateHealthSourceUrl,
};

/** Union of all Health tool names, derived from the HealthTools object */
export type HealthToolName = keyof typeof HealthTools;

// ============================================================================
// Source URL resolvers (co-located in tool files)
// ============================================================================

import { resolveSourceUrl as getHealthDataResolver } from './get-health-data.tool';

/** Collected source resolvers for Health tools */
export const healthSourceResolvers: Partial<Record<HealthToolName, ToolSourceResolver>> = {
    getHealthData: getHealthDataResolver,
};
