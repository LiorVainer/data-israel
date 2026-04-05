/**
 * Israel Drugs API Client
 *
 * Provides typed access to the Israel Ministry of Health drug information API.
 * All endpoints use POST requests with JSON bodies to a single base URL.
 *
 * Includes:
 * - Retry with exponential backoff for transient 5xx errors
 * - Concurrency limiter (p-limit) to avoid overwhelming the API
 */

import axios, { type AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { sleep } from '@/lib/utils/sleep';
import { DRUGS_BASE_URL } from './drugs.endpoints';
import type {
    DrugsAutocompleteRequest,
    DrugsAutocompleteResponse,
    DrugsSearchByNameRequest,
    DrugsSearchResponse,
    DrugsSearchBySymptomRequest,
    DrugsSearchGenericRequest,
    DrugsGetSpecificDrugRequest,
    DrugDetails,
    DrugsGetBySymptomRequest,
    DrugsSymptomHierarchyResponse,
    DrugsGetPopularSymptomsRequest,
    DrugsPopularSymptomsResponse,
    DrugsAtcListResponse,
    DrugsAdminRoutesResponse,
} from './drugs.types';

// ============================================================================
// Axios Instance
// ============================================================================

const drugsInstance: AxiosInstance = axios.create({
    baseURL: DRUGS_BASE_URL,
    timeout: 30_000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// ============================================================================
// Concurrency Limiter
// ============================================================================

/** Max 3 concurrent Drugs API requests */
const drugsLimit = pLimit(3);

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
 * Generic POST request for Drugs API with:
 * - Concurrency limiting (max 3 concurrent requests via p-limit)
 * - Retry with exponential backoff for 5xx errors and timeouts
 */
function drugsPost<T>(endpoint: string, body: unknown): Promise<T> {
    return drugsLimit(() => drugsPostWithRetry<T>(endpoint, body));
}

async function drugsPostWithRetry<T>(endpoint: string, body: unknown): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await drugsInstance.post<T>(endpoint, body);
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

    throw lastError ?? new Error('Drugs API request failed after retries');
}

// ============================================================================
// Drugs API Client
// ============================================================================

/**
 * Israel Drugs API client with organized namespaces
 */
export const drugsApi = {
    /**
     * Search / Discovery
     */
    search: {
        /** Autocomplete drug name suggestions */
        autocomplete: (params: DrugsAutocompleteRequest) =>
            drugsPost<DrugsAutocompleteResponse>('/SearchBoxAutocomplete', params),

        /** Search drugs by name with pagination */
        byName: (params: DrugsSearchByNameRequest) => drugsPost<DrugsSearchResponse>('/SearchByName', params),

        /** Search drugs by symptom */
        bySymptom: (params: DrugsSearchBySymptomRequest) => drugsPost<DrugsSearchResponse>('/SearchBySymptom', params),

        /** Advanced search by ATC codes, routes, packages */
        generic: (params: DrugsSearchGenericRequest) => drugsPost<DrugsSearchResponse>('/SearchGeneric', params),
    },

    /**
     * Drug Information
     */
    info: {
        /** Get comprehensive drug details by registration number */
        details: (params: DrugsGetSpecificDrugRequest) => drugsPost<DrugDetails>('/GetSpecificDrug', params),
    },

    /**
     * Symptom & Classification Discovery
     */
    discovery: {
        /** Get full symptom hierarchy */
        symptomHierarchy: (params: DrugsGetBySymptomRequest) =>
            drugsPost<DrugsSymptomHierarchyResponse>('/GetBySymptom', params),

        /** Get popular symptoms for fast search */
        popularSymptoms: (params: DrugsGetPopularSymptomsRequest) =>
            drugsPost<DrugsPopularSymptomsResponse>('/GetFastSearchPopularSymptoms', params),

        /** Get all ATC therapeutic classification codes */
        atcList: () => drugsPost<DrugsAtcListResponse>('/GetAtcList', {}),

        /** Get all administration routes */
        adminRoutes: () => drugsPost<DrugsAdminRoutesResponse>('/GetMatanList', {}),
    },
};
