/**
 * Grocery Price Feed Type Definitions
 *
 * Types for parsed XML price data from Israeli supermarket chains.
 * Covers PricesFull, Stores, and Promos feed formats.
 */

import type { ChainId } from './grocery.endpoints';

// ============================================================================
// Raw XML Parsed Shapes (from fast-xml-parser)
// ============================================================================

/** Raw item from PricesFull XML feed */
export interface RawPriceItem {
    ItemCode?: string;
    ItemBarcode?: string;
    ItemName?: string;
    ItemNm?: string;
    ManufacturerName?: string;
    ManufacturerItemDescription?: string;
    ManufactureItemDescription?: string;
    UnitQty?: string;
    Quantity?: string;
    UnitOfMeasure?: string;
    UnitMeasure?: string;
    ItemPrice?: string;
    UnitOfMeasurePrice?: string;
    UnitMeasurePrice?: string;
    AllowDiscount?: string;
    bIsWeighted?: string;
    ItemStatus?: string;
    ItemId?: string;
    PriceUpdateDate?: string;
}

/** Raw store from Stores XML feed */
export interface RawStoreItem {
    StoreId?: string;
    StoreName?: string;
    StoreNm?: string;
    Address?: string;
    City?: string;
    ZipCode?: string;
    ChainId?: string;
    SubChainId?: string;
    BikoretNo?: string;
}

/** Raw promotion from Promos XML feed */
export interface RawPromoItem {
    PromotionId?: string;
    PromotionDescription?: string;
    PromotionStartDate?: string;
    PromotionStartHour?: string;
    PromotionEndDate?: string;
    PromotionEndHour?: string;
    MinQty?: string;
    MaxQty?: string;
    DiscountRate?: string;
    DiscountType?: string;
    RewardType?: string;
    AllowMultipleDiscounts?: string;
    /** Items (barcodes) participating in this promotion */
    PromotionItems?: { ItemCode?: string }[] | { ItemCode?: string };
}

// ============================================================================
// Normalized Types (used by tools)
// ============================================================================

/** Normalized grocery item with price */
export interface GroceryItem {
    /** Product barcode (EAN-13) */
    barcode: string;
    /** Internal chain item code */
    itemCode: string;
    /** Product name in Hebrew */
    name: string;
    /** Manufacturer name */
    manufacturer: string;
    /** Unit quantity description */
    unitQty: string;
    /** Unit of measure (e.g., 'ליטר', 'ק"ג') */
    unitOfMeasure: string;
    /** Price in ILS (includes 18% VAT) */
    price: number;
    /** Price per unit of measure in ILS */
    unitPrice: number;
    /** Whether discounts are allowed */
    allowDiscount: boolean;
    /** Whether item is sold by weight (price is per kg) vs fixed quantity */
    isWeighted: boolean;
    /** Last price update date */
    priceUpdateDate: string;
}

/** Normalized store information */
export interface GroceryStore {
    /** Store identifier */
    storeId: string;
    /** Store name in Hebrew */
    name: string;
    /** Street address */
    address: string;
    /** City name in Hebrew */
    city: string;
    /** ZIP/postal code */
    zipCode: string;
    /** Sub-chain identifier */
    subChainId: string;
}

/** Normalized promotion */
export interface GroceryPromotion {
    /** Promotion identifier */
    promotionId: string;
    /** Hebrew description */
    description: string;
    /** Start date (ISO string) */
    startDate: string;
    /** End date (ISO string) */
    endDate: string;
    /** Minimum quantity to qualify */
    minQty: number;
    /** Maximum quantity allowed */
    maxQty: number;
    /** Discount rate (percentage or fixed amount) */
    discountRate: number;
    /** Discount type description */
    discountType: string;
    /** Participating item barcodes */
    itemCodes: string[];
}

/** Price comparison entry across chains */
export interface PriceComparison {
    /** Product barcode */
    barcode: string;
    /** Product name (from first chain that has it) */
    name: string;
    /** Manufacturer name */
    manufacturer: string;
    /** Price per chain */
    prices: {
        chainId: ChainId;
        chainName: string;
        price: number;
        unitPrice: number;
        priceUpdateDate: string;
    }[];
    /** Cheapest price */
    cheapestPrice: number;
    /** Chain with cheapest price */
    cheapestChain: ChainId;
    /** Most expensive price */
    mostExpensivePrice: number;
    /** Price difference percentage between cheapest and most expensive */
    priceDiffPercent: number;
}

/** Feed index entry from chain's file listing */
export interface FeedFileEntry {
    /** File name (e.g., 'PriceFull7290027600005-001-202403170600.gz') */
    fileName: string;
    /** File URL */
    fileUrl: string;
    /** Feed type (PricesFull, Stores, Promos) */
    feedType: string;
    /** Store ID extracted from filename (if applicable) */
    storeId?: string;
}
