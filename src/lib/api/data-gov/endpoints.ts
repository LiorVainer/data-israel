/**
 * Data.gov.il CKAN API Endpoint Constants and URL Builder
 *
 * Provides typed endpoint constants and URL construction utilities
 * for the Israeli open data portal API.
 */

/**
 * CKAN Base URL for data.gov.il
 */
export const DATAGOV_BASE_URL = 'https://data.gov.il/api/3';

/**
 * CKAN Action API Endpoint Paths
 */
export const DATAGOV_ENDPOINTS = {
    /**
     * System endpoints
     */
    system: {
        /** Get CKAN version and installed extensions */
        statusShow: '/action/status_show',
        /** Get list of available licenses */
        licenseList: '/action/license_list',
        /** Get the schema for a dataset type */
        schemingDatasetSchemaShow: '/action/scheming_dataset_schema_show',
    },

    /**
     * Dataset endpoints
     */
    dataset: {
        /** Get all dataset IDs */
        list: '/action/package_list',
        /** Search for datasets */
        search: '/action/package_search',
        /** Get details for a specific dataset */
        show: '/action/package_show',
        /** Get activity stream of a dataset */
        activityList: '/action/package_activity_list',
    },

    /**
     * Organization endpoints
     */
    organization: {
        /** List all organizations */
        list: '/action/organization_list',
        /** Get details of a specific organization */
        show: '/action/organization_show',
        /** Get activity stream of an organization */
        activityList: '/action/organization_activity_list',
    },

    /**
     * Resource endpoints
     */
    resource: {
        /** Search for resources */
        search: '/action/resource_search',
        /** Get metadata for a specific resource */
        show: '/action/resource_show',
    },

    /**
     * Group endpoints
     */
    group: {
        /** List all groups */
        list: '/action/group_list',
    },

    /**
     * Tag endpoints
     */
    tag: {
        /** List all tags */
        list: '/action/tag_list',
    },

    /**
     * DataStore endpoints
     */
    datastore: {
        /** Search/query data within a DataStore resource */
        search: '/action/datastore_search',
    },
} as const;

/**
 * Type representing all possible endpoint paths
 */
export type DataGovEndpointPath =
    | (typeof DATAGOV_ENDPOINTS.system)[keyof typeof DATAGOV_ENDPOINTS.system]
    | (typeof DATAGOV_ENDPOINTS.dataset)[keyof typeof DATAGOV_ENDPOINTS.dataset]
    | (typeof DATAGOV_ENDPOINTS.organization)[keyof typeof DATAGOV_ENDPOINTS.organization]
    | (typeof DATAGOV_ENDPOINTS.resource)[keyof typeof DATAGOV_ENDPOINTS.resource]
    | (typeof DATAGOV_ENDPOINTS.group)[keyof typeof DATAGOV_ENDPOINTS.group]
    | (typeof DATAGOV_ENDPOINTS.tag)[keyof typeof DATAGOV_ENDPOINTS.tag]
    | (typeof DATAGOV_ENDPOINTS.datastore)[keyof typeof DATAGOV_ENDPOINTS.datastore];

/**
 * Parameter types for each endpoint category
 */
export interface DataGovEndpointParams {
    /** Parameters for system.schemingDatasetSchemaShow */
    schemaShow: {
        type?: 'dataset' | 'info';
    };

    /** Parameters for dataset.search (package_search) */
    datasetSearch: {
        q?: string;
        sort?: string;
        rows?: number;
        start?: number;
    };

    /** Parameters for dataset.show (package_show) */
    datasetShow: {
        id: string;
    };

    /** Parameters for dataset.activityList (package_activity_list) */
    datasetActivity: {
        id: string;
        offset?: number;
        limit?: number;
    };

    /** Parameters for organization.show */
    organizationShow: {
        id: string;
    };

    /** Parameters for organization.activityList */
    organizationActivity: {
        id: string;
        offset?: number;
        limit?: number;
    };

    /** Parameters for resource.search */
    resourceSearch: {
        query: string;
        order_by?: string;
        offset?: number;
        limit?: number;
    };

    /** Parameters for resource.show */
    resourceShow: {
        id: string;
        include_tracking?: boolean;
    };

    /** Parameters for group.list */
    groupList: {
        order_by?: string;
        limit?: number;
        offset?: number;
        all_fields?: boolean;
    };

    /** Parameters for tag.list */
    tagList: {
        query?: string;
        all_fields?: boolean;
    };

    /** Parameters for datastore.search */
    datastoreSearch: {
        resource_id: string;
        filters?: Record<string, string | number>;
        q?: string;
        plain?: boolean;
        limit?: number;
        offset?: number;
        sort?: string;
    };
}

/**
 * Generic URL parameter value type
 */
type UrlParamValue = string | number | boolean | undefined;

/**
 * URL parameters record type
 */
type UrlParams = Record<string, UrlParamValue>;

/**
 * Builds a complete URL for the data.gov.il CKAN API
 *
 * @param path - The API endpoint path (e.g., '/action/package_search')
 * @param params - Optional query parameters object
 * @returns The complete URL with encoded query parameters
 *
 * @example
 * ```typescript
 * // Simple endpoint without params
 * buildDataGovUrl(DATAGOV_ENDPOINTS.system.statusShow)
 * // => 'https://data.gov.il/api/3/action/status_show'
 *
 * // Endpoint with params
 * buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.search, { q: 'תחבורה', rows: 10 })
 * // => 'https://data.gov.il/api/3/action/package_search?q=%D7%AA%D7%97%D7%91%D7%95%D7%A8%D7%94&rows=10'
 *
 * // Params with undefined values are omitted
 * buildDataGovUrl(DATAGOV_ENDPOINTS.dataset.show, { id: 'my-dataset', extra: undefined })
 * // => 'https://data.gov.il/api/3/action/package_show?id=my-dataset'
 * ```
 */
export function buildDataGovUrl(path: string, params?: UrlParams): string {
    const baseUrl = `${DATAGOV_BASE_URL}${path}`;

    if (!params) {
        return baseUrl;
    }

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        // Skip undefined values
        if (value === undefined) {
            continue;
        }

        // Convert value to string
        searchParams.append(key, String(value));
    }

    const queryString = searchParams.toString();

    if (!queryString) {
        return baseUrl;
    }

    return `${baseUrl}?${queryString}`;
}

/**
 * Builds a URL for datastore search with filters support
 *
 * Handles the special case where filters need to be JSON stringified
 *
 * @param params - Datastore search parameters
 * @returns The complete URL with encoded query parameters
 *
 * @example
 * ```typescript
 * buildDatastoreSearchUrl({
 *   resource_id: 'abc123',
 *   filters: { field: 'value' },
 *   limit: 100
 * })
 * // => 'https://data.gov.il/api/3/action/datastore_search?resource_id=abc123&filters=%7B%22field%22%3A%22value%22%7D&limit=100'
 * ```
 */
export function buildDatastoreSearchUrl(params: DataGovEndpointParams['datastoreSearch']): string {
    const { filters, ...restParams } = params;

    const urlParams: UrlParams = { ...restParams };

    if (filters) {
        urlParams.filters = JSON.stringify(filters);
    }

    return buildDataGovUrl(DATAGOV_ENDPOINTS.datastore.search, urlParams);
}
