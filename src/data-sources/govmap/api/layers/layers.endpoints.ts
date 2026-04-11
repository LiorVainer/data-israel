/**
 * Layers-Catalog Endpoint Definitions
 *
 * URL builders for the layers-catalog API.
 */

import { buildGovmapUrl } from '../govmap.endpoints';
import { GOVMAP_LAYERS_CATALOG_PATHS } from '../govmap.endpoints';

export function buildEntitiesByPointUrl(): string {
    return buildGovmapUrl(GOVMAP_LAYERS_CATALOG_PATHS.ENTITIES_BY_POINT);
}

export { buildLayerMetadataUrl } from '../govmap.endpoints';
