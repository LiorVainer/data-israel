/**
 * GovMap Tools — Cross-Layer Aggregator
 *
 * Merges tools from all GovMap layers into a single object.
 * New layers spread their tools here.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

// Layer re-exports
export { NadlanTools, type NadlanToolName, nadlanSourceConfigs } from './nadlan';
export { LayersTools, type LayersToolName, layersSourceConfigs } from './layers';

import { NadlanTools, nadlanSourceConfigs } from './nadlan';
import { LayersTools, layersSourceConfigs } from './layers';

/** All GovMap tools across all layers */
export const GovmapTools = {
    ...NadlanTools,
    ...LayersTools,
} as const;

/** Union of all GovMap tool names */
export type GovmapToolName = keyof typeof GovmapTools;

/** Aggregated declarative source configs from all layers */
export const govmapSourceConfigs: Partial<Record<GovmapToolName, ToolSourceConfig>> = {
    ...nadlanSourceConfigs,
    ...layersSourceConfigs,
};
