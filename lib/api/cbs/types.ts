/**
 * Israel CBS (Central Bureau of Statistics) API Type Definitions
 *
 * Types for 3 sub-APIs:
 * - Series API (https://apis.cbs.gov.il/series/)
 * - Price Index API (https://api.cbs.gov.il/index/)
 * - Dictionary API (https://api.cbs.gov.il/dictionary/)
 */

// ============================================================================
// Common
// ============================================================================

/** Supported languages */
export type CbsLang = 'he' | 'en';

/** Common pagination parameters */
export interface CbsPaginationParams {
    page?: number;
    pagesize?: number;
}

// ============================================================================
// Series API Types
// ============================================================================

/** Catalog item in the hierarchical subject tree */
export interface CbsCatalogItem {
    id?: string;
    code?: string;
    name?: string;
    nameEng?: string;
    parentCode?: string;
    level?: number;
    path?: string;
    seriesCount?: number;
    childCount?: number;
}

/** Catalog level response */
export interface CbsCatalogResponse {
    level?: number;
    subject?: string;
    items?: CbsCatalogItem[];
    totalItems?: number;
    page?: number;
    pageSize?: number;
}

/** A single data point in a time series */
export interface CbsSeriesDataPoint {
    date?: string;
    value?: number | string | null;
    statusCode?: string;
    statusText?: string;
}

/** Series metadata */
export interface CbsSeriesInfo {
    id?: string;
    code?: string;
    name?: string;
    nameEng?: string;
    unit?: string;
    unitEng?: string;
    frequency?: string;
    lastUpdate?: string;
    subject?: string;
}

/** Response for series data requests */
export interface CbsSeriesDataResponse {
    series?: CbsSeriesInfo;
    data?: CbsSeriesDataPoint[];
    totalItems?: number;
}

/** Parameters for catalog level browsing */
export interface CbsCatalogLevelParams extends CbsPaginationParams {
    id: number;
    subject?: string;
    lang?: CbsLang;
}

/** Parameters for catalog path browsing */
export interface CbsCatalogPathParams extends CbsPaginationParams {
    id: string;
    lang?: CbsLang;
}

/** Parameters for series data retrieval */
export interface CbsSeriesDataParams extends CbsPaginationParams {
    id: string;
    startPeriod?: string;
    endPeriod?: string;
    last?: number;
    addNull?: boolean;
    data_hide?: boolean;
    lang?: CbsLang;
}

// ============================================================================
// Price Index API Types
// ============================================================================

/** Price index catalog chapter */
export interface CbsPriceChapter {
    id?: string;
    code?: string;
    name?: string;
    nameEng?: string;
}

/** Price index topic/subject */
export interface CbsPriceTopic {
    id?: string;
    code?: string;
    name?: string;
    nameEng?: string;
    chapterId?: string;
}

/** Price index code entry */
export interface CbsPriceIndexCode {
    id?: string;
    code?: string;
    name?: string;
    nameEng?: string;
    subjectId?: string;
    base?: string;
}

/** Price index data point */
export interface CbsPriceDataPoint {
    date?: string;
    value?: number | string | null;
    change?: number | string | null;
    base?: string;
}

/** Response for price data */
export interface CbsPriceDataResponse {
    index?: CbsPriceIndexCode;
    data?: CbsPriceDataPoint[];
    totalItems?: number;
}

/** Price calculator result */
export interface CbsPriceCalculatorResult {
    originalAmount?: number;
    adjustedAmount?: number;
    coefficient?: number;
    startDate?: string;
    endDate?: string;
    indexCode?: string;
    startValue?: number;
    endValue?: number;
}

/** Parameters for price data retrieval */
export interface CbsPriceDataParams {
    id: string;
    startPeriod?: string;
    endPeriod?: string;
    last?: number;
    coef?: boolean;
    lang?: CbsLang;
}

/** Parameters for price calculator */
export interface CbsPriceCalculatorParams {
    id: string;
    startDate: string;
    endDate: string;
    sum?: number;
    lang?: CbsLang;
}

// ============================================================================
// Dictionary API Types
// ============================================================================

/** Dictionary item (locality, district, region, etc.) */
export interface CbsDictionaryItem {
    id?: string | number;
    name_heb?: string;
    name_eng?: string;
    year?: number;
    [key: string]: unknown;
}

/** Locality-specific fields */
export interface CbsLocality extends CbsDictionaryItem {
    district?: string | CbsDictionaryItem;
    region?: string | CbsDictionaryItem;
    natural_area?: string | CbsDictionaryItem;
    population?: number;
    population_group?: string | CbsDictionaryItem;
    municipal_status?: string | CbsDictionaryItem;
    religion?: string | CbsDictionaryItem;
    locality_type?: string | CbsDictionaryItem;
}

/** Dictionary search parameters */
export interface CbsDictionarySearchParams {
    q?: string;
    string_match_type?: 'BEGINS_WITH' | 'CONTAINS' | 'EQUALS';
    sort?: string;
    expand?: boolean | 'up' | 'down';
    fields?: string;
    filter?: string;
    page?: number;
    page_size?: number;
}

/** Dictionary response */
export interface CbsDictionaryResponse<T = CbsDictionaryItem> {
    data?: T[];
    total?: number;
    page?: number;
    pageSize?: number;
}
