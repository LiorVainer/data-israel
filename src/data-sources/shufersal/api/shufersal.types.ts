/**
 * Shufersal API Types
 *
 * Type definitions for the Shufersal online store API response shapes.
 * Based on the search endpoint at https://www.shufersal.co.il/online/he/search/results
 */

// ============================================================================
// Product Image
// ============================================================================

/** Product image from the Shufersal API */
export interface ShufersalProductImage {
    /** Full URL to the product image */
    url: string;
}

// ============================================================================
// Product Price
// ============================================================================

/** Product price from the Shufersal API */
export interface ShufersalProductPrice {
    /** Numeric price value */
    value: number;
    /** Formatted price string (e.g., "₪12.90") */
    formattedValue: string;
}

// ============================================================================
// Selling Method
// ============================================================================

/** Product selling method */
export interface ShufersalSellingMethod {
    /** Selling method code (e.g., "byUnit", "byWeight") */
    code: string;
}

// ============================================================================
// Product
// ============================================================================

/** Product record from Shufersal search results */
export interface ShufersalProduct {
    /** Product barcode / internal code */
    code: string;
    /** Product name in Hebrew */
    name: string;
    /** Product price info */
    price: ShufersalProductPrice;
    /** Manufacturer name */
    manufacturer: string;
    /** Unit description (e.g., "1 ליטר", "500 גרם") */
    unitDescription: string;
    /** Brand name */
    brandName: string;
    /** Second-level product category */
    secondLevelCategory: string;
    /** Product images */
    images: ShufersalProductImage[];
    /** How the product is sold (by unit, by weight, etc.) */
    sellingMethod: ShufersalSellingMethod;
    /** Product summary / description */
    summary: string;
}

// ============================================================================
// Search Response
// ============================================================================

/** Search response from the Shufersal API */
export interface ShufersalSearchResponse {
    /** Array of matching products */
    results: ShufersalProduct[];
}
