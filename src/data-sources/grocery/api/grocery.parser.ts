/**
 * Grocery XML Feed Parser
 *
 * Parses gzipped XML price feeds from Israeli supermarket chains.
 * Handles field name variations across different chains (e.g., ItemName vs ItemNm).
 * Uses fast-xml-parser for XML→JSON conversion and Node.js zlib for gzip decompression.
 */

import { XMLParser } from 'fast-xml-parser';
import { gunzipSync } from 'zlib';
import type {
    RawPriceItem,
    RawStoreItem,
    RawPromoItem,
    GroceryItem,
    GroceryStore,
    GroceryPromotion,
} from './grocery.types';

// ============================================================================
// XML Parser Configuration
// ============================================================================

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (tagName) => {
        // These tags should always be treated as arrays
        const arrayTags = new Set(['Item', 'Product', 'Store', 'Branch', 'Sale', 'Promotion']);
        return arrayTags.has(tagName);
    },
    trimValues: true,
});

// ============================================================================
// Gzip Decompression
// ============================================================================

/**
 * Decompress a gzipped buffer to a UTF-8 string.
 * Israeli price feeds use gzip compression (Content-Encoding or .gz files).
 */
export function decompressGzip(buffer: Buffer): string {
    const decompressed = gunzipSync(buffer);
    return decompressed.toString('utf-8');
}

// ============================================================================
// XML Parsing
// ============================================================================

/**
 * Parse an XML string into a JavaScript object using fast-xml-parser.
 */
export function parseXml(xml: string): Record<string, unknown> {
    return xmlParser.parse(xml) as Record<string, unknown>;
}

// ============================================================================
// Price Item Normalization
// ============================================================================

/** Safe string extraction — handles field name variations across chains */
function str(item: RawPriceItem, ...keys: (keyof RawPriceItem)[]): string {
    for (const key of keys) {
        const val = item[key];
        if (val !== undefined && val !== null && val !== '') return String(val);
    }
    return '';
}

/** Parse a numeric string to number, defaulting to 0 */
function num(value: string | undefined | null): number {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normalize a raw price item from XML into a typed GroceryItem.
 * Handles field name variations across different chains.
 */
export function normalizePriceItem(raw: RawPriceItem): GroceryItem {
    return {
        barcode: str(raw, 'ItemBarcode', 'ItemCode'),
        itemCode: str(raw, 'ItemCode', 'ItemId'),
        name: str(raw, 'ItemName', 'ItemNm'),
        manufacturer: str(raw, 'ManufacturerName'),
        unitQty: str(raw, 'UnitQty', 'Quantity'),
        unitOfMeasure: str(raw, 'UnitOfMeasure', 'UnitMeasure'),
        price: num(raw.ItemPrice),
        unitPrice: num(raw.UnitOfMeasurePrice ?? raw.UnitMeasurePrice),
        allowDiscount: raw.AllowDiscount === '1' || raw.AllowDiscount === 'true',
        priceUpdateDate: str(raw, 'PriceUpdateDate'),
    };
}

/**
 * Normalize a raw store item from XML into a typed GroceryStore.
 */
export function normalizeStoreItem(raw: RawStoreItem): GroceryStore {
    return {
        storeId: raw.StoreId ?? '',
        name: raw.StoreName ?? raw.StoreNm ?? '',
        address: raw.Address ?? '',
        city: raw.City ?? '',
        zipCode: raw.ZipCode ?? '',
        subChainId: raw.SubChainId ?? '',
    };
}

/**
 * Normalize a raw promotion item from XML into a typed GroceryPromotion.
 */
export function normalizePromotionItem(raw: RawPromoItem): GroceryPromotion {
    // PromotionItems can be a single object or an array
    let itemCodes: string[] = [];
    if (raw.PromotionItems) {
        const items = Array.isArray(raw.PromotionItems) ? raw.PromotionItems : [raw.PromotionItems];
        itemCodes = items.map((i) => i.ItemCode ?? '').filter(Boolean);
    }

    return {
        promotionId: raw.PromotionId ?? '',
        description: raw.PromotionDescription ?? '',
        startDate: raw.PromotionStartDate ?? '',
        endDate: raw.PromotionEndDate ?? '',
        minQty: num(raw.MinQty),
        maxQty: num(raw.MaxQty),
        discountRate: num(raw.DiscountRate),
        discountType: raw.DiscountType ?? '',
        itemCodes,
    };
}

// ============================================================================
// Feed Extraction Helpers
// ============================================================================

/**
 * Extract price items from a parsed XML document.
 * Handles various root element structures across chains.
 */
export function extractPriceItems(parsed: Record<string, unknown>): RawPriceItem[] {
    return findArray<RawPriceItem>(parsed, ['Items', 'Products'], ['Item', 'Product']);
}

/**
 * Extract store items from a parsed XML document.
 */
export function extractStoreItems(parsed: Record<string, unknown>): RawStoreItem[] {
    return findArray<RawStoreItem>(parsed, ['Stores', 'Branches', 'SubChains'], ['Store', 'Branch']);
}

/**
 * Extract promotion items from a parsed XML document.
 */
export function extractPromotionItems(parsed: Record<string, unknown>): RawPromoItem[] {
    return findArray<RawPromoItem>(parsed, ['Sales', 'Promotions'], ['Sale', 'Promotion']);
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Navigate a parsed XML tree to find an array of items.
 * Tries multiple container and item tag names to handle chain-specific XML structures.
 */
function findArray<T>(obj: Record<string, unknown>, containerNames: string[], itemNames: string[]): T[] {
    // Try to find items at various nesting levels
    // Structure: Root > ... > ContainerTag > ItemTag[]
    const candidates = flattenToDepth(obj, 3);

    for (const candidate of candidates) {
        if (typeof candidate !== 'object' || candidate === null) continue;
        const cObj = candidate as Record<string, unknown>;

        // Try container > item pattern
        for (const containerName of containerNames) {
            const container = cObj[containerName];
            if (typeof container === 'object' && container !== null) {
                const containerObj = container as Record<string, unknown>;
                for (const itemName of itemNames) {
                    const items = containerObj[itemName];
                    if (Array.isArray(items)) return items as T[];
                }
            }
        }

        // Try direct item arrays at this level
        for (const itemName of itemNames) {
            const items = cObj[itemName];
            if (Array.isArray(items)) return items as T[];
        }
    }

    return [];
}

/**
 * Collect all objects up to a given depth in the parsed XML tree.
 * This helps find arrays regardless of the exact nesting structure.
 */
function flattenToDepth(obj: unknown, depth: number): unknown[] {
    if (depth <= 0 || typeof obj !== 'object' || obj === null) return [obj];

    const results: unknown[] = [obj];
    for (const value of Object.values(obj as Record<string, unknown>)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            results.push(...flattenToDepth(value, depth - 1));
        }
    }
    return results;
}
