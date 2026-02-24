/**
 * Data.gov.il Portal URL Constants
 *
 * Shared constants for building user-facing portal URLs.
 * These are browser URLs (not API URLs) that link to the
 * data.gov.il portal for viewing datasets, resources, and organizations.
 *
 * URL patterns:
 *   Dataset:      /he/datasets/{org_name}/{dataset_name}
 *   Resource:     /he/datasets/{org_name}/{dataset_name}/{resource_id}
 *   Organization: /he/organizations/{org_name}
 */

export const DATAGOV_PORTAL_BASE = 'https://data.gov.il/he';
export const DATAGOV_DATASETS_PORTAL = `${DATAGOV_PORTAL_BASE}/datasets`;
export const DATAGOV_ORGANIZATIONS_PORTAL = `${DATAGOV_PORTAL_BASE}/organizations`;

/** Build a portal URL for a dataset page */
export function buildDatasetPortalUrl(orgName: string, datasetName: string): string {
    return `${DATAGOV_DATASETS_PORTAL}/${encodeURIComponent(orgName)}/${encodeURIComponent(datasetName)}`;
}

/** Build a portal URL for a specific resource within a dataset */
export function buildResourcePortalUrl(orgName: string, datasetName: string, resourceId: string): string {
    return `${buildDatasetPortalUrl(orgName, datasetName)}/${encodeURIComponent(resourceId)}`;
}

/** Build a portal URL for an organization page */
export function buildOrganizationPortalUrl(orgName: string): string {
    return `${DATAGOV_ORGANIZATIONS_PORTAL}/${encodeURIComponent(orgName)}`;
}
