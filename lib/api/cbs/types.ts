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
    path: number[];
    name: string;
    pathDesc: string | null;
}

/** Paging metadata from catalog responses */
export interface CbsCatalogPaging {
    total_items: number;
    page_size: number;
    current_page: number;
    last_page: number;
    first_url: string;
    previous_url: string | null;
    current_url: string;
    next_url: string | null;
    last_url: string;
    base_url: string | null;
}

/** Inner catalogs wrapper */
export interface CbsCatalogs {
    catalog: CbsCatalogItem[];
    level: number;
    paging: CbsCatalogPaging;
}

/** Catalog level response */
export interface CbsCatalogResponse {
    catalogs: CbsCatalogs;
}

/** A labeled value pair (used for time, data, unit, calc, price fields) */
export interface CbsLabeledValue {
    value: number;
    name: string;
}

/** A single observation in a time series */
export interface CbsSeriesObservation {
    TimePeriod: string;
    Value: number;
}

/** Path level descriptor in series metadata */
export interface CbsSeriesPathLevel {
    value: number;
    name: string;
}

/** Series path hierarchy */
export interface CbsSeriesPath {
    level1: CbsSeriesPathLevel;
    level2: CbsSeriesPathLevel;
    level3: CbsSeriesPathLevel;
    level4: CbsSeriesPathLevel;
    name_id: CbsSeriesPathLevel;
}

/** A single series entry in the DataSet response */
export interface CbsSeriesEntry {
    id: number;
    ffu_num: number | null;
    time: CbsLabeledValue;
    data: CbsLabeledValue;
    unit: CbsLabeledValue;
    calc: CbsLabeledValue;
    price: CbsLabeledValue;
    path: CbsSeriesPath;
    precis: number;
    update: string;
    obs: CbsSeriesObservation[];
}

/** Response for series data requests */
export interface CbsSeriesDataResponse {
    DataSet: {
        Series: CbsSeriesEntry[];
        paging: CbsCatalogPaging;
    };
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
    chapterId: string;
    chapterName: string;
    chapterOrder: number;
    mainCode: number | null;
    subject: null;
}

/** Response for /catalog/catalog */
export interface CbsPriceChaptersResponse {
    chapters: CbsPriceChapter[];
}

/** Price index subject within a chapter */
export interface CbsPriceSubject {
    subjectId: number;
    subjectName: string;
    code: null;
}

/** Response for /catalog/chapter */
export interface CbsPriceChapterResponse {
    chapterId: string;
    chapterName: string | null;
    chapterOrder: number | null;
    mainCode: number | null;
    subject: CbsPriceSubject[];
}

/** Price index code entry */
export interface CbsPriceIndexCode {
    codeId: number;
    codePrefix: number;
    codeName: string;
    codeNote: string;
    codeLevel: number;
    codeLine: number;
    codeType: number;
    codeFromDate: string;
    codeToDate: string;
    codeCalcFromDate: string;
    codeCalcToDate: string;
    isMonth: boolean;
}

/** Response for /catalog/subject */
export interface CbsPriceSubjectResponse {
    subjectId: number;
    subjectName: string | null;
    code: CbsPriceIndexCode[];
}

/** Base description in price data */
export interface CbsPriceBase {
    baseDesc: string;
    value: number;
}

/** A single date entry in price data */
export interface CbsPriceDateEntry {
    year: number;
    percent: number;
    percentYear: number;
    currBase: CbsPriceBase;
    prevBase: CbsPriceBase | null;
    month: number;
    monthDesc: string;
}

/** A month series entry in price data */
export interface CbsPriceMonthEntry {
    code: number;
    name: string;
    date: CbsPriceDateEntry[];
}

/** Response for /data/price */
export interface CbsPriceDataResponse {
    month: CbsPriceMonthEntry[] | null;
    quarter: unknown;
    paging: CbsCatalogPaging;
}

/** Price calculator result — endpoint currently unavailable */
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

/** Dictionary paging (string-valued fields unlike series paging) */
export interface CbsDictionaryPaging {
    total_items: string;
    total_size: string;
    page_items: string;
    page_size: string;
    current_page: string;
    last_page: string;
    first_url: string;
    previous_url: string | null;
    current_url: string;
    next_url: string | null;
    last_url: string;
}

/** Dictionary ID field */
export interface CbsDictionaryId {
    id: string | null;
    year?: string;
}

/** Dictionary related entity (district, region, etc.) */
export interface CbsDictionaryRelated {
    ID: CbsDictionaryId;
    name_eng: string | null;
    name_heb: string | null;
}

/** Locality fields from the API */
export interface CbsLocalityData {
    ID: CbsDictionaryId;
    district: string;
    locality_type: string;
    metropolin: string | null;
    municipal_or_council_status: string | null;
    name_eng: string | null;
    name_heb: string;
    natural_area: string;
    organization: string | null;
    planning_committee: string | null;
    region: string;
    religion: string | null;
    total_arabs: string;
    total_jews: string;
    total_jews_and_others: string;
    total_population: string;
}

/** Expanded locality items including related entities */
export interface CbsLocalityItems {
    localities: CbsLocalityData;
    districts: CbsDictionaryRelated;
    locality_types: CbsDictionaryRelated;
    metropolins?: CbsDictionaryRelated;
    municipal_or_council_status?: CbsDictionaryRelated;
    natural_areas?: CbsDictionaryRelated;
    organizational_affiliations?: CbsDictionaryRelated;
    planning_committee?: CbsDictionaryRelated;
    regions?: CbsDictionaryRelated;
    religions?: CbsDictionaryRelated;
}

/** Dictionary response wrapper */
export interface CbsDictionaryResponse {
    dictionary: {
        status: string;
        code: string;
        data: {
            localities: {
                data: string;
                items: CbsLocalityItems;
            };
        };
        paging: CbsDictionaryPaging;
    };
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
