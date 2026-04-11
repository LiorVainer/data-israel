/**
 * Layers-Catalog API Types
 *
 * Types for the entitiesByPoint endpoint and layer metadata.
 */

/** Request body for POST /layers-catalog/entitiesByPoint */
export interface EntitiesByPointRequest {
    point: [number, number];
    layers: Array<{ layerId: string; filter?: string }>;
    tolerance: number;
    calculateDistance?: boolean;
    language?: 'he' | 'en';
}

import type { FieldValue } from './entity-cleaner';

/** Single field in an entity result */
export interface EntityField {
    fieldName: string;
    fieldValue: FieldValue | null;
    fieldType: number; // 1=text, 2=number, 3=check, 8=date
    isVisible: boolean;
}

/** Single entity from a layer query */
export interface LayerEntity {
    objectId: number;
    centroid: [number, number];
    geom: string;
    fields: EntityField[];
    distance?: number;
}

/** Result for one layer in the response */
export interface LayerResult {
    name: string;
    caption: string;
    fieldsMapping: Record<string, string>;
    entities: LayerEntity[];
    dim?: number | null;
    layerId?: string;
}

/** Response from entitiesByPoint */
export interface EntitiesByPointResponse {
    data: LayerResult[];
}

/** Layer metadata response */
export interface LayerMetadata {
    description: Record<string, string>;
    fields: Record<string, string>;
}
