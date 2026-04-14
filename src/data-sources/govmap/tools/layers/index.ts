/**
 * Layers (GovMap Catalog) Tools
 *
 * Re-exports all layer query tools and collects declarative source URL configs.
 */

import type { ToolSourceConfig } from '@/data-sources/types';

// Tool exports
export { findNearbyServices } from './find-nearby-services.tool';
export { getParcelInfo } from './get-parcel-info.tool';
export { findNearbyTourism } from './find-nearby-tourism.tool';
export { getLocationContext } from './get-location-context.tool';

// ============================================================================
// Collected tool object
// ============================================================================

import { findNearbyServices } from './find-nearby-services.tool';
import { getParcelInfo } from './get-parcel-info.tool';
import { findNearbyTourism } from './find-nearby-tourism.tool';
import { getLocationContext } from './get-location-context.tool';

/** All Layers tools as a single object */
export const LayersTools = {
    findNearbyServices,
    getParcelInfo,
    findNearbyTourism,
    getLocationContext,
};

/** Union of all Layers tool names, derived from the LayersTools object */
export type LayersToolName = keyof typeof LayersTools;

// ============================================================================
// Declarative source URL configs
// ============================================================================

/** Declarative source configs for Layers tools — registry auto-generates resolvers */
export const layersSourceConfigs: Partial<Record<LayersToolName, ToolSourceConfig>> = {
    findNearbyServices: { title: 'שירותים ציבוריים' },
    getParcelInfo: { title: 'מידע קרקעי' },
    findNearbyTourism: { title: 'תיירות ופנאי' },
    getLocationContext: { title: 'מידע אזורי' },
};
