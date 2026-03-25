/**
 * Knesset OData API Types
 *
 * Type definitions for all Knesset Parliament OData API response shapes.
 * Based on the OData service at http://knesset.gov.il/Odata/ParliamentInfo.svc
 */

// ============================================================================
// OData Response Wrapper
// ============================================================================

/** Standard OData collection response */
export interface ODataCollectionResponse<T> {
    value: T[];
    'odata.metadata'?: string;
    'odata.nextLink'?: string;
}

// ============================================================================
// Bills (KNS_Bill)
// ============================================================================

/** Bill record from KNS_Bill entity */
export interface KnsBill {
    BillID: number;
    /** Bill name in Hebrew */
    Name: string;
    /** Knesset number (e.g., 25) */
    KnessetNum: number;
    /** Bill sub-type ID: 53=government, 54=private, 55=committee */
    SubTypeID: number;
    /** Bill sub-type description in Hebrew */
    SubTypeDesc: string;
    /** Bill status ID */
    StatusID: number;
    /** Private bill number */
    PrivateNumber: string | null;
    /** Committee ID handling the bill */
    CommitteeID: number | null;
    /** Publication date (ISO string) */
    PublicationDate: string | null;
    /** Publication series description */
    PublicationSeriesDesc: string | null;
    /** Summary text */
    SummaryLaw: string | null;
    /** Last update date */
    LastUpdatedDate: string | null;
}

/** Bill sub-type ID mapping */
export const BILL_SUB_TYPES: Record<number, string> = {
    53: 'הצעת חוק ממשלתית',
    54: 'הצעת חוק פרטית',
    55: 'הצעת חוק של ועדה',
};

// ============================================================================
// Bill Initiators (KNS_BillInitiator)
// ============================================================================

/** Bill initiator record */
export interface KnsBillInitiator {
    BillInitiatorID: number;
    BillID: number;
    PersonID: number;
    IsInitiator: boolean;
    Ordinal: number;
    /** Expanded person data (when $expand=KNS_Person is used) */
    KNS_Person?: KnsPerson;
}

// ============================================================================
// Committees (KNS_Committee)
// ============================================================================

/** Committee record from KNS_Committee entity */
export interface KnsCommittee {
    CommitteeID: number;
    /** Committee name in Hebrew */
    Name: string;
    /** Committee type ID */
    CategoryID: number | null;
    /** Committee type description */
    CategoryDesc: string | null;
    /** Knesset number */
    KnessetNum: number;
    /** Parent committee ID (for sub-committees) */
    ParentCommitteeID: number | null;
    /** Committee email */
    CommitteeTypeID: number | null;
    /** Committee type description */
    CommitteeTypeDesc: string | null;
    /** Additional info */
    AdditionalTypeID: number | null;
    AdditionalTypeDesc: string | null;
    /** Is this the current active committee */
    IsCurrent: boolean;
    /** Last update date */
    LastUpdatedDate: string | null;
}

// ============================================================================
// Persons (KNS_Person)
// ============================================================================

/** Person record from KNS_Person entity */
export interface KnsPerson {
    PersonID: number;
    /** Last name in Hebrew */
    LastName: string;
    /** First name in Hebrew */
    FirstName: string;
    /** Gender description */
    GenderDesc: string | null;
    /** Email */
    Email: string | null;
    /** Is the person currently active */
    IsCurrent: boolean;
    /** Last update date */
    LastUpdatedDate: string | null;
}

// ============================================================================
// Person-to-Position (KNS_PersonToPosition)
// ============================================================================

/** Person-to-Position mapping for Knesset members */
export interface KnsPersonToPosition {
    PersonToPositionID: number;
    PersonID: number;
    /** Position ID: 43 = Knesset Member */
    PositionID: number;
    /** Knesset number */
    KnessetNum: number;
    /** Position start date */
    StartDate: string | null;
    /** Position end date */
    FinishDate: string | null;
    /** Expanded person data */
    KNS_Person?: KnsPerson;
}

/** Position ID constants */
export const POSITION_IDS = {
    /** Knesset member (חבר כנסת) */
    KNESSET_MEMBER: 43,
} as const;

// ============================================================================
// Current Knesset
// ============================================================================

/** The current Knesset number */
export const CURRENT_KNESSET_NUM = 25;
