/**
 * GovMap Tools — Cross-Layer Aggregator
 *
 * Merges tools from all GovMap layers into a single object.
 * New layers spread their tools here.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Layer re-exports
export { NadlanTools, type NadlanToolName, nadlanSourceResolvers } from './nadlan';

import { NadlanTools, nadlanSourceResolvers } from './nadlan';

/** All GovMap tools across all layers */
export const GovmapTools = {
    ...NadlanTools,
} as const;

/** Union of all GovMap tool names */
export type GovmapToolName = keyof typeof GovmapTools;

/** Aggregated source resolvers from all layers */
export const govmapSourceResolvers: Partial<Record<GovmapToolName, ToolSourceResolver>> = {
    ...nadlanSourceResolvers,
};
