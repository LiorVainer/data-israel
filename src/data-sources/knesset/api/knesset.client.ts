/**
 * Knesset OData API Client
 *
 * Provides typed access to the Knesset Parliament OData API.
 * Includes retry with exponential backoff and rate limiting.
 */

import axios, { type AxiosInstance } from 'axios';
import { sleep } from '@/lib/utils/sleep';
import { KNESSET_BASE_URL } from './knesset.endpoints';
import type {
    ODataCollectionResponse,
    KnsBill,
    KnsBillInitiator,
    KnsCommittee,
    KnsPersonToPosition,
} from './knesset.types';
import { POSITION_IDS, CURRENT_KNESSET_NUM } from './knesset.types';

// ============================================================================
// Axios Instance
// ============================================================================

const knessetInstance: AxiosInstance = axios.create({
    baseURL: KNESSET_BASE_URL,
    timeout: 30_000,
    headers: {
        Accept: 'application/json',
        'User-Agent': 'DataIsrael-Agent/1.0',
    },
});

// ============================================================================
// Rate Limiting
// ============================================================================

/** Min interval between requests (500ms = 2 req/s — conservative for government API) */
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

async function knessetRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            await rateLimit();

            const response = await knessetInstance.get<T>(endpoint, { params });
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

    throw lastError ?? new Error('Knesset API request failed after retries');
}

// ============================================================================
// OData Query Helpers
// ============================================================================

interface ODataQueryOptions {
    $filter?: string;
    $top?: number;
    $orderby?: string;
    $expand?: string;
    $select?: string;
    $skip?: number;
}

function buildODataParams(options: ODataQueryOptions): Record<string, string> {
    const params: Record<string, string> = {};
    if (options.$filter) params['$filter'] = options.$filter;
    if (options.$top !== undefined) params['$top'] = String(options.$top);
    if (options.$orderby) params['$orderby'] = options.$orderby;
    if (options.$expand) params['$expand'] = options.$expand;
    if (options.$select) params['$select'] = options.$select;
    if (options.$skip !== undefined) params['$skip'] = String(options.$skip);
    return params;
}

// ============================================================================
// Knesset API Client
// ============================================================================

export const knessetApi = {
    /**
     * Search bills by keyword in their name.
     * Uses OData substringof filter.
     */
    searchBills: async (
        keyword: string,
        knessetNum?: number,
        top: number = 20,
    ): Promise<{ bills: KnsBill[]; totalFound: number }> => {
        let filter = `substringof('${keyword}', Name)`;
        if (knessetNum !== undefined) {
            filter += ` and KnessetNum eq ${knessetNum}`;
        }

        const data = await knessetRequest<ODataCollectionResponse<KnsBill>>(
            '/KNS_Bill()',
            buildODataParams({
                $filter: filter,
                $top: top,
                $orderby: 'KnessetNum desc',
            }),
        );

        const bills = data.value ?? [];
        return { bills, totalFound: bills.length };
    },

    /**
     * Get detailed bill information by ID.
     */
    getBillById: async (billId: number): Promise<KnsBill | null> => {
        try {
            const data = await knessetRequest<KnsBill>(`/KNS_Bill(${billId})`);
            return data ?? null;
        } catch {
            return null;
        }
    },

    /**
     * Get bill initiators by bill ID.
     */
    getBillInitiators: async (billId: number): Promise<KnsBillInitiator[]> => {
        try {
            const data = await knessetRequest<ODataCollectionResponse<KnsBillInitiator>>(
                '/KNS_BillInitiator()',
                buildODataParams({
                    $filter: `BillID eq ${billId}`,
                    $expand: 'KNS_Person',
                }),
            );
            return data.value ?? [];
        } catch {
            return [];
        }
    },

    /**
     * Get committee details by ID.
     */
    getCommitteeById: async (committeeId: number): Promise<KnsCommittee | null> => {
        try {
            const data = await knessetRequest<KnsCommittee>(`/KNS_Committee(${committeeId})`);
            return data ?? null;
        } catch {
            return null;
        }
    },

    /**
     * List committees by Knesset number.
     */
    listCommittees: async (
        knessetNum: number,
        top: number = 50,
    ): Promise<{ committees: KnsCommittee[]; totalFound: number }> => {
        const data = await knessetRequest<ODataCollectionResponse<KnsCommittee>>(
            '/KNS_Committee()',
            buildODataParams({
                $filter: `KnessetNum eq ${knessetNum}`,
                $top: top,
            }),
        );

        const committees = data.value ?? [];
        return { committees, totalFound: committees.length };
    },

    /**
     * Get Knesset members by Knesset number.
     * Filters by PositionID=43 (Knesset member) and expands KNS_Person.
     */
    getKnessetMembers: async (
        knessetNum: number,
        top: number = 150,
    ): Promise<{ members: KnsPersonToPosition[]; totalFound: number }> => {
        const data = await knessetRequest<ODataCollectionResponse<KnsPersonToPosition>>(
            '/KNS_PersonToPosition()',
            buildODataParams({
                $filter: `KnessetNum eq ${knessetNum} and PositionID eq ${POSITION_IDS.KNESSET_MEMBER}`,
                $expand: 'KNS_Person',
                $top: top,
            }),
        );

        const members = data.value ?? [];
        return { members, totalFound: members.length };
    },

    /**
     * Get the current Knesset number.
     */
    getCurrentKnessetNum: (): number => {
        return CURRENT_KNESSET_NUM;
    },
};
