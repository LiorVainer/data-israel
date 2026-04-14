/**
 * Rami Levy Catalog API Types
 *
 * Type definitions for Rami Levy product catalog API response shapes.
 * Based on the catalog API at https://www.rami-levy.co.il/api/catalog
 */

// ============================================================================
// Product Types
// ============================================================================

/** Net content information for a product */
export interface RamiLevyNetContent {
    /** Unit of measure (e.g., 'ליטר', 'גרם') */
    UOM: string;
    /** Display text */
    text: string;
    /** Numeric value */
    value: number;
}

/** Product GS (General Specification) data */
export interface RamiLevyProductGs {
    /** Brand name (e.g., 'תנובה') */
    BrandName: string;
    /** Net content details */
    Net_Content: RamiLevyNetContent;
}

/** Product price information */
export interface RamiLevyProductPrice {
    /** Price in NIS */
    price: number;
}

/** Product images */
export interface RamiLevyProductImages {
    /** Small thumbnail URL */
    small: string;
}

/** Product department (top-level category) */
export interface RamiLevyDepartment {
    /** Department name in Hebrew */
    name: string;
}

/** Product group (mid-level category) */
export interface RamiLevyGroup {
    /** Group name in Hebrew */
    name: string;
}

/** Product sub-group (lowest category) */
export interface RamiLevySubGroup {
    /** Sub-group name in Hebrew */
    name: string;
}

/** Product properties */
export interface RamiLevyProductProp {
    /** Weight item flag (1 = sold by weight) */
    sw_shakil: number;
    /** By-kilo flag (1 = priced per kilo) */
    by_kilo: number;
}

/** A single product from the Rami Levy catalog */
export interface RamiLevyProduct {
    /** Product ID */
    id: number;
    /** Product name in Hebrew */
    name: string;
    /** Barcode (EAN) */
    barcode: string;
    /** Price info */
    price: RamiLevyProductPrice;
    /** General specification (brand, net content) */
    gs: RamiLevyProductGs;
    /** Product images */
    images: RamiLevyProductImages;
    /** Department (top-level category) */
    department: RamiLevyDepartment;
    /** Product group */
    group: RamiLevyGroup;
    /** Product sub-group */
    subGroup: RamiLevySubGroup;
    /** Product properties (weight/kilo flags) */
    prop: RamiLevyProductProp;
}

// ============================================================================
// API Response Types
// ============================================================================

/** Catalog search API response */
export interface RamiLevyCatalogResponse {
    /** HTTP status code */
    status: number;
    /** Total number of matching products */
    total: number;
    /** Array of matching products */
    data: RamiLevyProduct[];
}
