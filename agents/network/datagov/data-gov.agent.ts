/**
 * DataGov Search Agent
 *
 * Searches and explores Israeli open datasets from data.gov.il
 */

import { Agent } from '@mastra/core/agent';
import {
    searchDatasets,
    listAllDatasets,
    getDatasetDetails,
    getDatasetActivity,
    getDatasetSchema,
    listOrganizations,
    getOrganizationDetails,
    getOrganizationActivity,
    listGroups,
    listTags,
    searchResources,
    getResourceDetails,
    queryDatastoreResource,
    getStatus,
    listLicenses,
} from '@/lib/tools';
import { getModelId } from '../model';
import { DATAGOV_AGENT_CONFIG } from './config';

export const datagovAgent = new Agent({
    id: 'datagov-agent',
    name: DATAGOV_AGENT_CONFIG.name,
    description:
        'Searches and explores Israeli open datasets from data.gov.il — datasets, organizations, groups, tags, resources, and DataStore queries.',
    instructions: DATAGOV_AGENT_CONFIG.instructions,
    model: getModelId(),
    tools: {
        searchDatasets,
        listAllDatasets,
        getDatasetDetails,
        getDatasetActivity,
        getDatasetSchema,
        listOrganizations,
        getOrganizationDetails,
        getOrganizationActivity,
        listGroups,
        listTags,
        searchResources,
        getResourceDetails,
        queryDatastoreResource,
        getStatus,
        listLicenses,
    },
});
