/**
 * Israel Drugs API Type Definitions
 *
 * Types for the Israel Ministry of Health drug information API.
 * All requests are POST with JSON bodies.
 */

// ============================================================================
// Request Types
// ============================================================================

/** Autocomplete request */
export interface DrugsAutocompleteRequest {
    val: string;
    isSearchTradeName: '0' | '1';
    isSearchTradeMarkiv: '0' | '1';
}

/** Search by name request */
export interface DrugsSearchByNameRequest {
    val: string;
    prescription: boolean;
    healthServices: boolean;
    pageIndex: number;
    orderBy: number;
}

/** Search by symptom request */
export interface DrugsSearchBySymptomRequest {
    primarySymp: string;
    secondarySymp: string;
    prescription: boolean;
    healthServices: boolean;
    pageIndex: number;
    orderBy: number;
}

/** Generic (advanced) search request */
export interface DrugsSearchGenericRequest {
    val: string;
    atcId?: string | null;
    matanId?: number | null;
    packageId?: number | null;
    pageIndex: number;
    orderBy: number;
}

/** Get specific drug request */
export interface DrugsGetSpecificDrugRequest {
    dragRegNum: string;
}

/** Get by symptom hierarchy request */
export interface DrugsGetBySymptomRequest {
    prescription: boolean;
}

/** Get popular symptoms request */
export interface DrugsGetPopularSymptomsRequest {
    rowCount: number;
}

// ============================================================================
// Response Types
// ============================================================================

/** Autocomplete result item */
export interface DrugsAutocompleteResult {
    val: string;
}

/** Autocomplete response */
export interface DrugsAutocompleteResponse {
    results: string[];
}

/** Drug entry from search results */
export interface DrugSearchResultItem {
    dragRegNum: string;
    dragHebName: string;
    dragEnName: string;
    activeComponents: { componentName: string }[];
    activeComponentsDisplayName: string;
    prescription: boolean;
    health: boolean;
    dragRegOwner: string;
    route: string;
    dosageForm: string;
    secondarySymptom: string;
    images: { url: string }[];
    /** Total pages for this search */
    pages: number;
    /** Total matching results */
    results: number;
}

/** Search response — pagination info is per-item (pages, results fields) */
export interface DrugsSearchResponse {
    hasNonSubsDrugs: boolean;
    results: DrugSearchResultItem[];
}

/** Comprehensive drug details */
export interface DrugDetails {
    dragRegNum: string;
    dragHebName: string;
    dragEnName: string;
    activeMetirals: DrugActiveIngredient[];
    atc: DrugAtcEntry[];
    usageFormHeb: string;
    regOwnerName: string;
    regManufactureName: string;
    packages: DrugPackage[];
    health: boolean;
    isPrescription: boolean;
    brochure: DrugBrochure[] | null;
    images: { url: string; updateDate?: number }[];
    regDate: number;
    bitulDate: string | null;
    dosageForm: string;
    dragIndication: string | null;
    maxPrice: number | null;
    limitations: string | null;
    manufacturers: DrugManufacturerEntry[];
}

/** Active ingredient */
export interface DrugActiveIngredient {
    ingredientsDesc: string;
    dosage: string;
}

/** ATC classification entry */
export interface DrugAtcEntry {
    atc4Code: string;
    atc4Name: string;
    atc5Code: string;
    atc5Name: string;
}

/** Brochure/leaflet entry */
export interface DrugBrochure {
    lng: string | null;
    url: string;
    updateDate: number | null;
    type: string;
    display: string;
    updateDateFormat: string;
}

/** Manufacturer entry in details */
export interface DrugManufacturerEntry {
    manufactureName: string;
    manufactureSite: string;
}

/** Drug package info */
export interface DrugPackage {
    isPrescription: boolean;
    packageDesc: string;
    packMaterialDesc: string;
    unitPrice: number | null;
    packageMaxPrice: number | null;
}

/** Symptom category from hierarchy */
export interface DrugSymptomCategory {
    bySymptomMain: string;
    list: DrugSymptomItem[];
}

/** Individual symptom in the hierarchy */
export interface DrugSymptomItem {
    bySymptomSecond: number;
    bySymptomName: string;
}

/** Symptom hierarchy response — the API returns the array directly */
export type DrugsSymptomHierarchyResponse = DrugSymptomCategory[];

/** Popular symptom entry */
export interface DrugPopularSymptom {
    bySymptomSecond: number;
    bySymptomName: string;
    searchCount: number;
}

/** Popular symptoms response */
export interface DrugsPopularSymptomsResponse {
    results: DrugPopularSymptom[];
}

/** ATC classification code */
export interface DrugAtcCode {
    id: string;
    text: string;
}

/** ATC list response */
export interface DrugsAtcListResponse {
    results: DrugAtcCode[];
}

/** Administration route */
export interface DrugAdminRoute {
    matanId: number;
    matanName: string;
}

/** Admin routes response */
export interface DrugsAdminRoutesResponse {
    results: DrugAdminRoute[];
}
