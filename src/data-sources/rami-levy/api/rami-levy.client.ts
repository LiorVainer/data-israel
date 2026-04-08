/**
 * Rami Levy Catalog API Client
 *
 * Provides typed access to the Rami Levy product catalog API.
 * Includes retry with exponential backoff and rate limiting.
 */

import axios, { type AxiosInstance } from 'axios';
import { sleep } from '@/lib/utils/sleep';
import { getBrightDataAgent } from '@/lib/proxy/bright-data';
import { RAMI_LEVY_BASE_URL, RAMI_LEVY_CATALOG_PATH, RAMI_LEVY_DEFAULT_STORE_ID } from './rami-levy.endpoints';
import type { RamiLevyCatalogResponse, RamiLevyProduct } from './rami-levy.types';

// ============================================================================
// Axios Instance
// ============================================================================

// Rami Levy's catalog API appears to geo-gate non-Israeli egress — route
// through Bright Data IL when BRIGHT_DATA_PROXY_URL is configured. `proxy: false`
// is required so axios does not layer its own proxy on top of the HttpsProxyAgent.
const brightDataAgent = getBrightDataAgent();

const ramiLevyInstance: AxiosInstance = axios.create({
    baseURL: RAMI_LEVY_BASE_URL,
    timeout: 15_000,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Accept: 'application/json',
        locale: 'he',
        'User-Agent': 'DataIsrael-Agent/1.0',
    },
    ...(brightDataAgent && {
        httpsAgent: brightDataAgent,
        httpAgent: brightDataAgent,
        proxy: false as const,
    }),
});

// ============================================================================
// Rate Limiting
// ============================================================================

/** Min interval between requests (500ms = 2 req/s) */
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

async function ramiLevyRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            await rateLimit();

            const response = await ramiLevyInstance.post<T>(path, body);
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

    throw lastError ?? new Error('Rami Levy API request failed after retries');
}

// ============================================================================
// Rami Levy API Client
// ============================================================================

export const ramiLevyApi = {
    /**
     * Search products by name or barcode in a specific store.
     */
    searchProducts: async (
        query: string,
        storeId: string = RAMI_LEVY_DEFAULT_STORE_ID,
        limit: number = 10,
    ): Promise<{ products: RamiLevyProduct[]; total: number }> => {
        const data = await ramiLevyRequest<RamiLevyCatalogResponse>(RAMI_LEVY_CATALOG_PATH, {
            q: query,
            store: storeId,
            aggs: 1,
        });

        const products = (data.data ?? []).slice(0, limit);
        return { products, total: data.total ?? products.length };
    },
};
