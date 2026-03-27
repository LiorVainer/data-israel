/**
 * Shufersal API Client
 *
 * Provides typed access to the Shufersal online store search API.
 * Includes retry with exponential backoff and rate limiting.
 *
 * IMPORTANT: The `x-requested-with: XMLHttpRequest` header is REQUIRED
 * or the API returns HTML instead of JSON.
 */

import axios, { type AxiosInstance } from 'axios';
import { sleep } from '@/lib/utils/sleep';
import { SHUFERSAL_BASE_URL, SHUFERSAL_SEARCH_PATH } from './shufersal.endpoints';
import type { ShufersalSearchResponse, ShufersalProduct } from './shufersal.types';

// ============================================================================
// Axios Instance
// ============================================================================

const shufersalInstance: AxiosInstance = axios.create({
    baseURL: SHUFERSAL_BASE_URL,
    timeout: 30_000,
    headers: {
        Accept: 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        'User-Agent': 'DataIsrael-Agent/1.0',
    },
});

// ============================================================================
// Rate Limiting
// ============================================================================

/** Min interval between requests (500ms = 2 req/s — conservative for retail API) */
const MIN_INTERVAL_MS = 500;
let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
    const elapsed = Date.now() - lastRequestTime;
    if (elapsed < MIN_INTERVAL_MS) {
        await sleep(MIN_INTERVAL_MS - elapsed);
    }
    lastRequestTime = Date.now();
}

// ============================================================================
// Retry Logic
// ============================================================================

/** Status codes worth retrying (transient server errors) */
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function shufersalRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            await rateLimit();

            const response = await shufersalInstance.get<T>(endpoint, { params });
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

    throw lastError ?? new Error('Shufersal API request failed after retries');
}

// ============================================================================
// Shufersal API Client
// ============================================================================

export const shufersalApi = {
    /**
     * Search products by name, barcode, or keyword.
     *
     * @param query - Search query string (Hebrew or barcode)
     * @param limit - Maximum results to return (default: 15)
     * @returns Products and total found count
     */
    searchProducts: async (
        query: string,
        limit: number = 15,
    ): Promise<{ products: ShufersalProduct[]; totalFound: number }> => {
        const data = await shufersalRequest<ShufersalSearchResponse>(SHUFERSAL_SEARCH_PATH, {
            q: query,
            limit: String(limit),
        });

        const products = data.results ?? [];
        return { products, totalFound: products.length };
    },
};
