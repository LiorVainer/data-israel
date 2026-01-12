/**
 * Data.gov.il CKAN API Type Definitions
 *
 * These types represent the structure of responses from the Israeli
 * open data portal at https://data.gov.il/api/3
 */

/**
 * Generic wrapper for all CKAN API responses
 */
export interface DataGovResponse<T> {
  success: boolean;
  result: T;
  error?: {
    message: string;
    __type?: string;
  };
}

/**
 * Organization/Publisher information
 */
export interface Organization {
  id: string;
  name: string;
  title: string;
  description?: string;
  image_url?: string;
  created?: string;
  is_organization?: boolean;
  approval_status?: string;
  state?: string;
}

/**
 * Tag/Keyword for dataset taxonomy
 */
export interface Tag {
  id: string;
  name: string;
  display_name?: string;
  vocabulary_id?: string | null;
  state?: string;
}

/**
 * Resource - downloadable file within a dataset
 */
export interface Resource {
  id: string;
  name?: string;
  url: string;
  format: string;
  description?: string;
  created?: string;
  last_modified?: string | null;
  mimetype?: string | null;
  mimetype_inner?: string | null;
  size?: number | null;
  hash?: string | null;
  state?: string;
  package_id?: string;
}

/**
 * Dataset (Package) - main data entity
 */
export interface Dataset {
  id: string;
  name: string;
  title: string;
  notes: string;
  author?: string | null;
  author_email?: string | null;
  maintainer?: string | null;
  maintainer_email?: string | null;
  license_id?: string | null;
  license_title?: string | null;
  organization: Organization;
  tags: Tag[];
  resources: Resource[];
  groups?: Group[];
  relationships_as_subject?: unknown[];
  relationships_as_object?: unknown[];
  metadata_created?: string;
  metadata_modified?: string;
  creator_user_id?: string;
  state?: string;
  version?: string | null;
  type?: string;
  url?: string | null;
  private?: boolean;
  num_resources?: number;
  num_tags?: number;
}

/**
 * Group - publisher or category grouping
 */
export interface Group {
  id: string;
  name: string;
  title?: string;
  display_name: string;
  description: string;
  image_display_url?: string;
  image_url?: string;
  created?: string;
  is_organization?: boolean;
  approval_status?: string;
  state?: string;
  package_count?: number;
}

/**
 * Search result wrapper for package_search
 */
export interface SearchResult {
  count: number;
  facets?: Record<string, unknown>;
  results: Dataset[];
  sort?: string;
  search_facets?: Record<string, unknown>;
}
