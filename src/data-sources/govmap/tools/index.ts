/**
 * GovMap Tools — Cross-Layer Aggregator
 *
 * Merges tools from all GovMap layers into a single object.
 * New layers spread their tools here.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

// Layer re-exports
export { NadlanTools, type NadlanToolName, nadlanSourceConfigs } from './nadlan';

import { NadlanTools, nadlanSourceConfigs } from './nadlan';

/** All GovMap tools across all layers */
export const GovmapTools = {
    ...NadlanTools,
} as const;

/** Union of all GovMap tool names */
export type GovmapToolName = keyof typeof GovmapTools;

/** Aggregated declarative source configs from all layers */
export const govmapSourceConfigs: Partial<Record<GovmapToolName, ToolSourceConfig>> = {
    ...nadlanSourceConfigs,
};
