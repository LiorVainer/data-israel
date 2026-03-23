/**
 * DataGov Data Source
 *
 * Self-contained module for the data.gov.il Israeli open data portal.
 * Exports a DataSourceDefinition that can be registered in the central registry.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { DataGovTools, datagovSourceResolvers } from './tools';
import { datagovAgentDisplay, datagovBadgeConfig } from './datagov.display';
import { datagovTranslations } from './datagov.translations';
import {
    createDatagovAgent,
    DATAGOV_AGENT_NAME,
    DATAGOV_AGENT_DESCRIPTION,
    DATAGOV_AGENT_INSTRUCTIONS,
} from './datagov.agent';

export const DataGovDataSource = {
    id: 'datagov',

    agent: {
        id: 'datagovAgent',
        name: DATAGOV_AGENT_NAME,
        description: DATAGOV_AGENT_DESCRIPTION,
        instructions: DATAGOV_AGENT_INSTRUCTIONS,
        createAgent: createDatagovAgent,
    },

    display: {
        label: datagovAgentDisplay.label,
        icon: datagovAgentDisplay.icon,
        badge: datagovBadgeConfig,
    },

    routingHint:
        'נתוני ממשל פתוחים מאתר data.gov.il — מאגרי נתונים, ארגונים, קבוצות, תגיות, משאבים ושאילתות DataStore.',

    tools: DataGovTools,
    sourceResolvers: datagovSourceResolvers,
    translations: datagovTranslations,
} satisfies DataSourceDefinition<typeof DataGovTools>;

export type { DataGovToolName } from './tools';
export { DataGovTools } from './tools';
export { createDatagovAgent, datagovAgent } from './datagov.agent';
