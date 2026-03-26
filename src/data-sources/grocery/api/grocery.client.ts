/**
 * Grocery Price Feed API Client
 *
 * Fetches and parses XML price feeds from Israeli supermarket chains.
 * Includes:
 * - Feed index scraping to discover available files
 * - Gzipped XML download and decompression
 * - Concurrency limiting to avoid overwhelming chain servers
 * - Retry with exponential backoff for transient errors
 */

import axios, { type AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { sleep } from '@/lib/utils/sleep';
import type { ChainId } from './grocery.endpoints';
import { CHAIN_FEEDS, buildFeedIndexUrl } from './grocery.endpoints';
import {
    decompressGzip,
    parseXml,
    extractPriceItems,
    extractStoreItems,
    extractPromotionItems,
    normalizePriceItem,
    normalizeStoreItem,
    normalizePromotionItem,
} from './grocery.parser';
import type { GroceryItem, GroceryStore, GroceryPromotion, FeedFileEntry } from './grocery.types';

// ============================================================================
// Axios Instances
// ============================================================================

const commonConfig = {
    timeout: 30000,
    headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'DataIsrael/1.0 (Israeli Open Data Agent)',
    },
};

/** Create an Axios instance for a specific chain */
function createChainInstance(chainId: ChainId): AxiosInstance {
    return axios.create({
        ...commonConfig,
        baseURL: CHAIN_FEEDS[chainId].baseUrl,
    });
}

// ============================================================================
// Concurrency & Retry
// ============================================================================

/** Max 3 concurrent requests per chain to avoid rate limiting */
const groceryLimit = pLimit(3);

/** Status codes worth retrying */
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504, 429]);

/** Max retry attempts */
const MAX_RETRIES = 2;

/** Base delay in ms for exponential backoff */
const BASE_DELAY_MS = 2000;

async function fetchWithRetry<T>(
    instance: AxiosInstance,
    url: string,
    responseType: 'arraybuffer' | 'text' = 'text',
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await instance.get<T>(url, { responseType });
            return response.data;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            const isRetryable = status !== undefined && RETRYABLE_STATUS_CODES.has(status);
            const isTimeout = axios.isAxiosError(error) && error.code === 'ECONNABORTED';

            if ((isRetryable || isTimeout) && attempt < MAX_RETRIES) {
                await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
                continue;
            }

            throw lastError;
        }
    }

    throw lastError ?? new Error('Grocery API request failed after retries');
}

// ============================================================================
// Feed Index Parsing
// ============================================================================

/**
 * Fetch the file index page for a chain and extract available feed files.
 * The index page is an HTML page listing downloadable .gz files.
 */
export async function fetchFeedIndex(chainId: ChainId): Promise<FeedFileEntry[]> {
    return groceryLimit(async () => {
        const instance = createChainInstance(chainId);
        const indexUrl = buildFeedIndexUrl(chainId);
        const html = await fetchWithRetry<string>(instance, indexUrl);

        return parseFeedIndexHtml(html, chainId);
    });
}

/**
 * Parse feed index HTML to extract file entries.
 * Looks for links to .gz files in the HTML content.
 */
function parseFeedIndexHtml(html: string, chainId: ChainId): FeedFileEntry[] {
    const entries: FeedFileEntry[] = [];
    const baseUrl = CHAIN_FEEDS[chainId].baseUrl;

    // Match href attributes pointing to .gz files (may have query params like ?sv=... after .gz)
    const linkRegex = /href=["']([^"']*\.gz[^"']*)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null) {
        const fileName = match[1];
        const fileUrl = fileName.startsWith('http') ? fileName : `${baseUrl}/${fileName}`;

        // Determine feed type from filename
        let feedType = 'unknown';
        const lowerName = fileName.toLowerCase();
        if (lowerName.includes('pricefull') || lowerName.includes('prices') || lowerName.includes('/price')) {
            feedType = 'PricesFull';
        } else if (lowerName.includes('store') || lowerName.includes('branch')) {
            feedType = 'Stores';
        } else if (lowerName.includes('promo') || lowerName.includes('sale')) {
            feedType = 'Promos';
        }

        // Extract store ID from filename if present (e.g., PriceFull7290027600005-001-...)
        const storeMatch = /[-_](\d{3})[-_]/.exec(fileName);
        const storeId = storeMatch?.[1];

        entries.push({ fileName, fileUrl, feedType, storeId });
    }

    return entries;
}

// ============================================================================
// Feed Data Fetching
// ============================================================================

/**
 * Download and parse a gzipped XML price feed file.
 * Returns normalized grocery items.
 */
export async function fetchPricesFull(chainId: ChainId, fileUrl: string): Promise<GroceryItem[]> {
    return groceryLimit(async () => {
        const instance = createChainInstance(chainId);
        const buffer = await fetchWithRetry<Buffer>(instance, fileUrl, 'arraybuffer');

        let xml: string;
        try {
            xml = decompressGzip(Buffer.from(buffer));
        } catch {
            // Some feeds may not be gzipped despite the .gz extension
            xml = Buffer.from(buffer).toString('utf-8');
        }

        const parsed = parseXml(xml);
        const rawItems = extractPriceItems(parsed);
        return rawItems.map(normalizePriceItem);
    });
}

/**
 * Download and parse a gzipped XML stores feed file.
 * Returns normalized store entries.
 */
export async function fetchStores(chainId: ChainId, fileUrl: string): Promise<GroceryStore[]> {
    return groceryLimit(async () => {
        const instance = createChainInstance(chainId);
        const buffer = await fetchWithRetry<Buffer>(instance, fileUrl, 'arraybuffer');

        let xml: string;
        try {
            xml = decompressGzip(Buffer.from(buffer));
        } catch {
            xml = Buffer.from(buffer).toString('utf-8');
        }

        const parsed = parseXml(xml);
        const rawItems = extractStoreItems(parsed);
        return rawItems.map(normalizeStoreItem);
    });
}

/**
 * Download and parse a gzipped XML promotions feed file.
 * Returns normalized promotion entries.
 */
export async function fetchPromotions(chainId: ChainId, fileUrl: string): Promise<GroceryPromotion[]> {
    return groceryLimit(async () => {
        const instance = createChainInstance(chainId);
        const buffer = await fetchWithRetry<Buffer>(instance, fileUrl, 'arraybuffer');

        let xml: string;
        try {
            xml = decompressGzip(Buffer.from(buffer));
        } catch {
            xml = Buffer.from(buffer).toString('utf-8');
        }

        const parsed = parseXml(xml);
        const rawItems = extractPromotionItems(parsed);
        return rawItems.map(normalizePromotionItem);
    });
}

// ============================================================================
// Convenience: Search products by barcode or name
// ============================================================================

/**
 * Search for products in a chain's price feed by barcode or name.
 * Downloads the first available PricesFull file and filters.
 *
 * @param chainId - The chain to search
 * @param query - Barcode (exact match) or product name (partial match)
 * @param limit - Max results to return (default 20)
 */
export async function searchProducts(chainId: ChainId, query: string, limit: number = 20): Promise<GroceryItem[]> {
    // First, get the feed index to find a PricesFull file
    const feedFiles = await fetchFeedIndex(chainId);
    const priceFile = feedFiles.find((f) => f.feedType === 'PricesFull');

    if (!priceFile) {
        throw new Error(`No PricesFull feed file found for chain ${CHAIN_FEEDS[chainId].name}`);
    }

    const items = await fetchPricesFull(chainId, priceFile.fileUrl);

    // Check if query looks like a barcode (all digits)
    const isBarcode = /^\d+$/.test(query);

    const filtered = items.filter((item) => {
        if (isBarcode) {
            return item.barcode === query || item.itemCode === query;
        }
        return item.name.includes(query) || item.manufacturer.includes(query);
    });

    return filtered.slice(0, limit);
}
