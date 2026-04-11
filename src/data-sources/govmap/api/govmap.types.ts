/**
 * GovMap Shared Types
 *
 * Type definitions shared across all GovMap-based data sources.
 * Layer-specific types live in their own subfolders.
 */

// ============================================================================
// Autocomplete
// ============================================================================

/** Single result from address autocomplete */
export interface AutocompleteResult {
    /** Display text for the address */
    text: string;
    /** Unique identifier */
    id: string;
    /** Result type (address, street, city, etc.) */
    type: string;
    /** Relevance score */
    score: number;
    /** WKT POINT string with coordinates, e.g. "POINT(34.78 32.07)" */
    shape?: string;
}

/** Response from address autocomplete API */
export interface AutocompleteResponse {
    resultsCount: number;
    results: AutocompleteResult[];
}

// ============================================================================
// Coordinates
// ============================================================================

/** Parsed coordinate point (ITM projection) */
export interface CoordinatePoint {
    /** X coordinate in ITM projection (meters) */
    longitude: number;
    /** Y coordinate in ITM projection (meters) */
    latitude: number;
}
