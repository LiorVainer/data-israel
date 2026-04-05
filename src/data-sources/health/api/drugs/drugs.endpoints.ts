/**
 * Israel Drugs API Endpoint Definitions
 *
 * Provides constants and URL builders for the Israel Ministry of Health
 * drug information API (israeldrugs.health.gov.il).
 *
 * All requests are POST with JSON bodies to a single base URL.
 */

// ============================================================================
// Base URLs
// ============================================================================

/** Base URL for Israel Drugs API */
export const DRUGS_BASE_URL = 'https://israeldrugs.health.gov.il/GovServiceList/IDRServer';

/** Base URL for drug images */
export const DRUGS_IMAGES_BASE_URL = 'https://mohpublic.z6.web.core.windows.net/IsraelDrugs';

// ============================================================================
// Endpoint Path Constants
// ============================================================================

/** API endpoint paths (appended to DRUGS_BASE_URL) */
export const DRUGS_PATHS = {
    /** Autocomplete drug name suggestions */
    SEARCH_AUTOCOMPLETE: '/SearchBoxAutocomplete',
    /** Search drugs by name */
    SEARCH_BY_NAME: '/SearchByName',
    /** Search drugs by symptom */
    SEARCH_BY_SYMPTOM: '/SearchBySymptom',
    /** Advanced search by ATC codes, routes, packages */
    SEARCH_GENERIC: '/SearchGeneric',
    /** Get comprehensive drug details by registration number */
    GET_SPECIFIC_DRUG: '/GetSpecificDrug',
    /** Get full symptom hierarchy */
    GET_BY_SYMPTOM: '/GetBySymptom',
    /** Get popular symptoms for fast search */
    GET_POPULAR_SYMPTOMS: '/GetFastSearchPopularSymptoms',
    /** Get all ATC therapeutic classification codes */
    GET_ATC_LIST: '/GetAtcList',
    /** Get all administration routes */
    GET_MATAN_LIST: '/GetMatanList',
} as const;

/** Combined drugs endpoints configuration */
export const DRUGS_ENDPOINTS = {
    baseUrl: DRUGS_BASE_URL,
    imagesBaseUrl: DRUGS_IMAGES_BASE_URL,
    paths: DRUGS_PATHS,
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/** Allowed values for Drugs API paths */
export type DrugsPath = (typeof DRUGS_PATHS)[keyof typeof DRUGS_PATHS];

// ============================================================================
// URL Builder Functions
// ============================================================================

/**
 * Builds a complete Drugs API URL from the base URL and path.
 *
 * @param path - The endpoint path
 * @returns The fully constructed URL
 *
 * @example
 * buildDrugsUrl(DRUGS_PATHS.SEARCH_BY_NAME)
 * // Returns: "https://israeldrugs.health.gov.il/GovServiceList/IDRServer/SearchByName"
 */
export function buildDrugsUrl(path: DrugsPath): string {
    return `${DRUGS_BASE_URL}${path}`;
}

/**
 * Builds a drug image URL from a filename.
 *
 * @param filename - The image filename
 * @returns The fully constructed image URL
 */
export function buildDrugImageUrl(filename: string): string {
    return `${DRUGS_IMAGES_BASE_URL}/${encodeURIComponent(filename)}`;
}

/**
 * Builds a portal URL for the Israeli drugs registry website.
 *
 * @param registrationNumber - Drug registration number
 * @returns Portal URL for the drug
 */
export function buildDrugsPortalUrl(registrationNumber?: string): string {
    if (registrationNumber) {
        return `https://israeldrugs.health.gov.il/#/drug/${encodeURIComponent(registrationNumber)}`;
    }
    return 'https://israeldrugs.health.gov.il';
}
