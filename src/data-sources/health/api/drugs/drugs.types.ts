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
    dragEngName: string;
    activeIngredients: string;
    bpiLink: string | null;
    pilLink: string | null;
    healthServices: boolean;
    prescription: boolean;
    images: string[];
    atcCode: string;
    matanName: string;
    manufacturer: string;
}

/** Paginated search response */
export interface DrugsSearchResponse {
    results: DrugSearchResultItem[];
    currentPage: number;
    totalCount: number;
}

/** Comprehensive drug details */
export interface DrugDetails {
    dragRegNum: string;
    dragHebName: string;
    dragEngName: string;
    activeIngredients: DrugActiveIngredient[];
    atcList: DrugAtcEntry[];
    matanName: string;
    manufacturer: DrugManufacturer;
    packages: DrugPackage[];
    healthServices: boolean;
    prescription: boolean;
    bpiLink: string | null;
    pilLink: string | null;
    images: string[];
    registrationDate: string;
    cancelDate: string | null;
}

/** Active ingredient */
export interface DrugActiveIngredient {
    name: string;
    strength: string;
    unit: string;
}

/** ATC classification entry */
export interface DrugAtcEntry {
    atcCode: string;
    atcName: string;
}

/** Drug manufacturer info */
export interface DrugManufacturer {
    name: string;
    country: string;
}

/** Drug package info */
export interface DrugPackage {
    packageName: string;
    quantity: number;
    price: number | null;
    healthBasketPrice: number | null;
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
