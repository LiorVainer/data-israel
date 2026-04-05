/**
 * IL Health API Type Definitions
 *
 * Types for the Israeli Ministry of Health data dashboard API.
 */

// ============================================================================
// Metadata Types
// ============================================================================

/** Section entry from the dashboard metadata API */
export interface HealthSectionRaw {
    id: string;
    order: number;
    type: string;
    layoutIsGrid: number;
    parentId: string | null;
    dataTypeName: string;
}

/** Card entry from the dashboard metadata API — each card maps to an API endpoint */
export interface HealthCard {
    id: string;
    order: number;
    sectionId: string;
    width: number;
    hight: number;
    mfeLink: string;
    componentName: string;
    endPointName: string;
    apiSrc: string;
    embedLink: string | null;
    mobileEmbedLink: string | null;
    transportProject: string;
    mainDashboard: string;
}

/** Link resource in metadata */
export interface HealthLink {
    id: string;
    url: string;
    shortUrl?: string;
    imgFileSrc?: string;
    sectionId: string;
    order: number | null;
}

/** Metadata response for a subject (actual API shape) */
export interface HealthMetadataResponse {
    sections: HealthSectionRaw[];
    cards: HealthCard[];
    links: HealthLink[];
    filters: unknown[];
    filtersValues: unknown[];
}

// ============================================================================
// Data Types
// ============================================================================

/**
 * Data response — varies per endpoint.
 * The actual shape depends on the endpoint, so we use a flexible type.
 */
export type HealthDataResponse = Record<string, unknown> | unknown[];
