/**
 * IL Health API Type Definitions
 *
 * Types for the Israeli Ministry of Health data dashboard API.
 */

// ============================================================================
// Metadata Types
// ============================================================================

/** Endpoint definition from metadata */
export interface HealthEndpointDef {
    endPointName: string;
    dataName: string;
    description: string;
    embedLink?: string;
}

/** Section within a dashboard subject */
export interface HealthSection {
    sectionId: string;
    sectionTitle: string;
    endpoints: HealthEndpointDef[];
    links?: HealthLink[];
}

/** Link resource in metadata */
export interface HealthLink {
    title: string;
    url: string;
    description?: string;
}

/** Metadata response for a subject */
export interface HealthMetadataResponse {
    availableEndpoints: HealthEndpointDef[];
    sections: HealthSection[];
}

// ============================================================================
// Data Types
// ============================================================================

/**
 * Data response — varies per endpoint.
 * The actual shape depends on the endpoint, so we use a flexible type.
 */
export type HealthDataResponse = Record<string, unknown> | unknown[];
