/**
 * IL Health Data Dashboard API Client
 *
 * Provides typed access to the Israeli Ministry of Health data dashboard.
 * All endpoints use GET requests returning JSON.
 *
 * Includes:
 * - Retry with exponential backoff for transient 5xx errors
 * - Concurrency limiter (p-limit) to avoid overwhelming the API
 */

import axios, { type AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { sleep } from '@/lib/utils/sleep';
import { HEALTH_METADATA_BASE_URL, HEALTH_DATA_BASE_URL } from './health.endpoints';
import type { HealthSubject } from './health.endpoints';
import type { HealthMetadataResponse, HealthDataResponse } from './health.types';

// ============================================================================
// Axios Instances
// ============================================================================

const commonConfig = {
    timeout: 30_000,
    headers: {
        Accept: 'application/json',
    },
};

/** Axios instance for metadata endpoints */
const metadataInstance: AxiosInstance = axios.create({
    ...commonConfig,
    baseURL: HEALTH_METADATA_BASE_URL,
});

/** Axios instance for data endpoints */
const dataInstance: AxiosInstance = axios.create({
    ...commonConfig,
    baseURL: HEALTH_DATA_BASE_URL,
});

// ============================================================================
// Concurrency Limiter
// ============================================================================

/** Max 3 concurrent Health API requests */
const healthLimit = pLimit(3);

// ============================================================================
// Generic Helpers
// ============================================================================

/** Status codes worth retrying (transient server errors) */
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);

/** Max retry attempts for transient API errors */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff */
const BASE_DELAY_MS = 1000;

/**
 * Generic GET request with:
 * - Concurrency limiting via p-limit
 * - Retry with exponential backoff for 5xx errors and timeouts
 */
function healthGet<T>(instance: AxiosInstance, endpoint: string): Promise<T> {
    return healthLimit(() => healthGetWithRetry<T>(instance, endpoint));
}

async function healthGetWithRetry<T>(instance: AxiosInstance, endpoint: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await instance.get<T>(endpoint);
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

    throw lastError ?? new Error('Health API request failed after retries');
}

// ============================================================================
// Health API Client
// ============================================================================

/**
 * IL Health data dashboard API client
 */
export const healthApi = {
    /**
     * Get metadata for a specific health subject.
     * Returns available endpoints and sections.
     */
    getMetadata: (subject: HealthSubject) => healthGet<HealthMetadataResponse>(metadataInstance, `/${subject}`),

    /**
     * Get data from a specific endpoint.
     * The endpoint name comes from metadata results.
     */
    getData: (endpointName: string) => healthGet<HealthDataResponse>(dataInstance, `/${endpointName}`),
};
