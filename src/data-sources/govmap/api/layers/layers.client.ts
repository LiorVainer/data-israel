/**
 * Layers-Catalog API Client
 *
 * Queries GovMap map layers by location using the entitiesByPoint endpoint.
 * Reuses the shared GovMap HTTP infrastructure (rate limiting, retries, concurrency).
 * Entity cleaning is delegated to entity-cleaner.ts.
 */

import { govmapRequest } from '../govmap.client';
import { GOVMAP_LAYERS_CATALOG_PATHS } from '../govmap.endpoints';
import type { EntitiesByPointRequest, EntitiesByPointResponse, LayerMetadata } from './layers.types';
import { cleanEntity } from './entity-cleaner';
import type { CleanEntity } from './entity-cleaner';

// Re-export for consumers that import CleanEntity from the client
export type { CleanEntity } from './entity-cleaner';

// ============================================================================
// API Methods
// ============================================================================

/** Query entities from multiple layers near a geographic point. */
export async function queryEntitiesByPoint(params: EntitiesByPointRequest): Promise<EntitiesByPointResponse> {
    return govmapRequest<EntitiesByPointResponse>('post', GOVMAP_LAYERS_CATALOG_PATHS.ENTITIES_BY_POINT, {
        data: { ...params },
    });
}

/** Get field definitions and source info for a layer. Returns null if unavailable. */
export async function getLayerMetadata(layerId: string): Promise<LayerMetadata | null> {
    try {
        return await govmapRequest<LayerMetadata | null>(
            'get',
            `${GOVMAP_LAYERS_CATALOG_PATHS.LAYER_METADATA}/${encodeURIComponent(layerId)}/metadata`,
        );
    } catch {
        return null;
    }
}

// ============================================================================
// Query + Clean Pipeline
// ============================================================================

/** Query and clean entities for a set of layers, sorted by distance */
export async function queryAndCleanEntities(
    point: [number, number],
    layerIds: readonly string[],
    tolerance: number,
): Promise<Map<string, CleanEntity[]>> {
    const response = await queryEntitiesByPoint({
        point,
        layers: layerIds.map((layerId) => ({ layerId })),
        tolerance,
        calculateDistance: true,
        language: 'he',
    });

    const result = new Map<string, CleanEntity[]>();

    for (const layerResult of response.data) {
        const cleaned = layerResult.entities
            .map((raw) => cleanEntity(raw))
            .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        result.set(layerResult.name.toLowerCase(), cleaned);
    }

    return result;
}
