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

/**
 * DataStore field definition
 */
export interface DataStoreField {
  id: string;
  type: string;
}

/**
 * DataStore search result for datastore_search
 */
export interface DataStoreSearchResult {
  fields: DataStoreField[];
  records: Record<string, unknown>[];
  total: number;
  _links?: {
    start: string;
    next?: string;
  };
}

/**
 * CKAN Status information
 */
export interface CKANStatus {
  site_title?: string;
  site_description?: string;
  site_url?: string;
  ckan_version?: string;
  extensions?: string[];
}

/**
 * License information
 */
export interface License {
  id: string;
  title: string;
  url?: string;
  status?: string;
  maintainer?: string;
  family?: string;
  domain_content?: boolean;
  domain_data?: boolean;
  domain_software?: boolean;
  is_generic?: boolean;
  is_okd_compliant?: boolean;
  is_osi_compliant?: boolean;
}

/**
 * Activity stream item
 */
export interface Activity {
  id: string;
  timestamp: string;
  user_id: string;
  object_id?: string;
  activity_type: string;
  data?: Record<string, unknown>;
}

/**
 * Resource search result
 */
export interface ResourceSearchResult {
  count: number;
  results: Resource[];
}

/**
 * Dataset schema from scheming_dataset_schema_show
 */
export interface DatasetSchema {
  scheming_version?: number;
  dataset_type?: string;
  about?: string;
  about_url?: string;
  dataset_fields?: SchemaField[];
  resource_fields?: SchemaField[];
}

/**
 * Schema field definition
 */
export interface SchemaField {
  field_name: string;
  label?: string | Record<string, string>;
  preset?: string;
  form_snippet?: string;
  display_snippet?: string;
  validators?: string;
  output_validators?: string;
  help_text?: string | Record<string, string>;
  required?: boolean;
  choices?: Array<{ value: string; label: string | Record<string, string> }>;
}
