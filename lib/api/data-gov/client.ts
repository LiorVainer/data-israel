/**
 * Data.gov.il CKAN API Client
 *
 * Provides typed access to the Israeli open data portal API
 * Base URL: https://data.gov.il/api/3
 */

import axios from 'axios';
import type { DataGovResponse, Dataset, Group, Tag, SearchResult, DataStoreSearchResult } from './types';

const BASE_URL = 'https://data.gov.il/api/3';

/**
 * Axios instance configured for data.gov.il API
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Generic GET request that automatically unwraps DataGovResponse
 * @param endpoint - API endpoint (e.g., '/action/package_search')
 * @param params - Query parameters
 * @returns The unwrapped result from the API response
 */
async function dataGovGet<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await axiosInstance.get<DataGovResponse<T>>(endpoint, { params });
  return response.data.result;
}

/**
 * Data.gov.il API client with organized namespaces
 */
export const dataGovApi = {
  /**
   * Dataset operations
   */
  dataset: {
    /**
     * Search for datasets
     * @param params - Search parameters
     * @returns Search results with count and dataset list
     */
    search: async (params: {
      q?: string;
      sort?: string;
      rows?: number;
      start?: number;
    }) => {
      return dataGovGet<SearchResult>('/action/package_search', params);
    },

    /**
     * Get details for a specific dataset
     * @param id - Dataset ID or name
     * @returns Full dataset information
     */
    show: async (id: string) => {
      return dataGovGet<Dataset>('/action/package_show', { id });
    },
  },

  /**
   * Group (publisher/category) operations
   */
  group: {
    /**
     * List all groups
     * @param params - List parameters
     * @returns Array of groups
     */
    list: async (params?: {
      order_by?: string;
      limit?: number;
      offset?: number;
      all_fields?: boolean;
    }) => {
      return dataGovGet<Group[]>('/action/group_list', params);
    },
  },

  /**
   * Tag (keyword) operations
   */
  tag: {
    /**
     * List all tags
     * @param params - List parameters
     * @returns Array of tags
     */
    list: async (params?: {
      query?: string;
      all_fields?: boolean;
    }) => {
      return dataGovGet<Tag[]>('/action/tag_list', params);
    },
  },

  /**
   * DataStore operations for querying resource data
   */
  datastore: {
    /**
     * Search/query data within a DataStore resource
     * @param params - Query parameters
     * @returns DataStore search results with fields and records
     */
    search: async (params: {
      resource_id: string;
      filters?: Record<string, string | number>;
      q?: string;
      plain?: boolean;
      limit?: number;
      offset?: number;
      sort?: string;
    }) => {
      // Convert filters object to JSON string if provided
      const queryParams: Record<string, unknown> = {
        resource_id: params.resource_id,
        limit: params.limit,
        offset: params.offset,
        sort: params.sort,
        q: params.q,
        plain: params.plain,
      };

      if (params.filters) {
        queryParams.filters = JSON.stringify(params.filters);
      }

      return dataGovGet<DataStoreSearchResult>('/action/datastore_search', queryParams);
    },
  },
};
