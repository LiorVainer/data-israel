/**
 * GovMap Shared API Client
 *
 * Provides the shared Axios instance, rate limiting, concurrency control,
 * and generic request helper for all GovMap-based data sources.
 */

import axios, { type AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { sleep } from '@/lib/utils/sleep';
import { GOVMAP_BASE_URL } from './govmap.endpoints';
import type { CoordinatePoint } from './govmap.types';

// Re-export for convenience
export type { CoordinatePoint } from './govmap.types';

// ============================================================================
// Axios Instance
// ============================================================================

const govmapInstance: AxiosInstance = axios.create({
    baseURL: GOVMAP_BASE_URL,
    timeout: 30_000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'NadlanMCP/1.0.0',
        Origin: 'https://www.govmap.gov.il', // Required by layers-catalog endpoints
    },
});

// ============================================================================
// Rate Limiting & Concurrency
// ============================================================================

/** Max 5 concurrent requests to respect GovMap rate limit */
const govmapLimit = pLimit(5);

/** Min interval between requests (200ms = 5 req/s) */
const MIN_INTERVAL_MS = 200;
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

/**
 * Generic GovMap API request with retry, rate limiting, and concurrency control.
 *
 * @param method - HTTP method ('get' or 'post')
 * @param endpoint - API endpoint path (relative to GOVMAP_BASE_URL)
 * @param options - Optional query params or request body
 * @returns Typed response data
 */
export async function govmapRequest<T>(
    method: 'get' | 'post',
    endpoint: string,
    options?: { params?: Record<string, unknown>; data?: Record<string, unknown> },
): Promise<T> {
    return govmapLimit(async () => {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                await rateLimit();

                const response =
                    method === 'get'
                        ? await govmapInstance.get<T>(endpoint, { params: options?.params })
                        : await govmapInstance.post<T>(endpoint, options?.data);

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

        throw lastError ?? new Error('Govmap API request failed after retries');
    });
}

// ============================================================================
// Coordinate Parsing
// ============================================================================

/**
 * Parse coordinates from a WKT POINT string.
 *
 * @param shape - WKT POINT string, e.g. "POINT(34.78 32.07)"
 * @returns Parsed coordinate point, or undefined if parsing fails
 */
export function parseCoordinatesFromShape(shape?: string): CoordinatePoint | undefined {
    if (!shape || !shape.startsWith('POINT(')) return undefined;
    try {
        const coordsStr = shape.slice(6, -1); // Remove "POINT(" and ")"
        const parts = coordsStr.split(/\s+/);
        if (parts.length === 2) {
            return { longitude: parseFloat(parts[0]), latitude: parseFloat(parts[1]) };
        }
    } catch {
        // Ignore parse errors
    }
    return undefined;
}
