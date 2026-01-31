/**
 * DataGov Search Agent
 *
 * Searches and explores Israeli open datasets from data.gov.il
 */

import { Agent } from '@mastra/core/agent';
import {
    getDatasetActivity,
    getDatasetDetails,
    getDatasetSchema,
    getOrganizationActivity,
    getOrganizationDetails,
    getResourceDetails,
    getStatus,
    listAllDatasets,
    listGroups,
    listLicenses,
    listOrganizations,
    listTags,
    queryDatastoreResource,
    searchDatasets,
    searchResources,
} from '@/lib/tools';
import { getModelId } from '../model';
import { DATAGOV_AGENT_CONFIG } from './config';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

export const datagovAgent = new Agent({
    id: 'datagovAgent',
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
    memory: new Memory({
        storage: new LibSQLStore({
            id: 'mastra-storage',
            url: ':memory:',
        }),
    }),
});
