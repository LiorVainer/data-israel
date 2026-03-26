/**
 * Knesset OData API Endpoint Definitions
 *
 * Provides typed constants and URL builders for the Knesset Parliament OData API.
 * Base URL: https://knesset.gov.il/Odata/ParliamentInfo.svc
 *
 * No authentication required. Format: OData JSON.
 */

// ============================================================================
// Base URL
// ============================================================================

/** Base URL for Knesset OData API */
export const KNESSET_BASE_URL = 'https://knesset.gov.il/Odata/ParliamentInfo.svc';

// ============================================================================
// Entity Path Constants
// ============================================================================

/** Knesset OData entity paths */
export const KNESSET_ENTITIES = {
    /** Bills (legislation proposals) */
    BILLS: '/KNS_Bill()',
    /** Single bill by ID */
    BILL_BY_ID: '/KNS_Bill',
    /** Committees */
    COMMITTEES: '/KNS_Committee()',
    /** Single committee by ID */
    COMMITTEE_BY_ID: '/KNS_Committee',
    /** Person-to-Position mapping (Knesset members, ministers, etc.) */
    PERSON_TO_POSITION: '/KNS_PersonToPosition()',
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/** Allowed Knesset entity path values */
export type KnessetEntity = (typeof KNESSET_ENTITIES)[keyof typeof KNESSET_ENTITIES];

/** OData query parameter values */
export type ODataParamValue = string | number | boolean | undefined | null;

/** OData query parameters record */
export type ODataParams = Record<string, ODataParamValue>;

// ============================================================================
// URL Builder Functions
// ============================================================================

/**
 * Builds a complete Knesset OData API URL from base, entity path, and optional OData params.
 *
 * @param entityPath - The entity path (e.g., '/KNS_Bill()')
 * @param params - Optional OData query parameters ($filter, $top, $orderby, $expand, $select)
 * @returns The fully constructed URL
 *
 * @example
 * buildKnessetUrl('/KNS_Bill()', { $filter: "KnessetNum eq 25", $top: '20' })
 */
export function buildKnessetUrl(entityPath: string, params?: ODataParams): string {
    const normalizedBase = KNESSET_BASE_URL.endsWith('/') ? KNESSET_BASE_URL.slice(0, -1) : KNESSET_BASE_URL;
    const normalizedPath = entityPath.startsWith('/') ? entityPath : `/${entityPath}`;

    let fullUrl = `${normalizedBase}${normalizedPath}`;

    if (params) {
        const queryParts: string[] = [];
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
            }
        }
        if (queryParts.length > 0) {
            fullUrl += `?${queryParts.join('&')}`;
        }
    }

    return fullUrl;
}

/**
 * Builds a URL for a single entity by ID.
 *
 * @example
 * buildEntityByIdUrl('/KNS_Bill', 12345)
 * // Returns: "https://knesset.gov.il/Odata/ParliamentInfo.svc/KNS_Bill(12345)"
 */
export function buildEntityByIdUrl(entityBase: string, id: number, params?: ODataParams): string {
    return buildKnessetUrl(`${entityBase}(${id})`, params);
}

// ============================================================================
// Portal URL Builder (for source URL generation)
// ============================================================================

/** Knesset main portal base URL */
export const KNESSET_PORTAL_BASE_URL = 'https://main.knesset.gov.il';

/**
 * Builds a Knesset portal URL for viewing a bill.
 */
export function buildBillPortalUrl(billId: number): string {
    return `${KNESSET_PORTAL_BASE_URL}/Activity/Legislation/Laws/Pages/LawBill.aspx?t=lawsuggestionssearch&lawitemid=${billId}`;
}

/**
 * Builds a Knesset portal URL for viewing a committee.
 */
export function buildCommitteePortalUrl(committeeId: number): string {
    return `${KNESSET_PORTAL_BASE_URL}/Activity/committees/Pages/AllCommittees.aspx?committeeId=${committeeId}`;
}

/**
 * Builds a Knesset portal URL for viewing members of a specific Knesset.
 */
export function buildMembersPortalUrl(knessetNum: number): string {
    return `${KNESSET_PORTAL_BASE_URL}/About/Lexicon/Pages/MKs.aspx?knesset=${knessetNum}`;
}

/**
 * Builds a general Knesset portal URL.
 */
export function buildKnessetPortalUrl(): string {
    return KNESSET_PORTAL_BASE_URL;
}
