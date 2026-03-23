/**
 * CBS Data Source Definition
 *
 * Self-contained module for the Israeli Central Bureau of Statistics data source.
 * Satisfies the DataSourceDefinition interface for registry integration.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { CbsTools, cbsSourceResolvers } from './tools';
import { createCbsAgent, CBS_AGENT_NAME, CBS_AGENT_DESCRIPTION, CBS_AGENT_INSTRUCTIONS } from './cbs.agent';
import { cbsDisplayLabel, cbsDisplayIcon, cbsBadgeConfig } from './cbs.display';
import { cbsTranslations } from './cbs.translations';

export const CbsDataSource = {
    id: 'cbs',

    agent: {
        id: 'cbsAgent',
        name: CBS_AGENT_NAME,
        description: CBS_AGENT_DESCRIPTION,
        instructions: CBS_AGENT_INSTRUCTIONS,
        createAgent: createCbsAgent,
    },

    display: {
        label: cbsDisplayLabel,
        icon: cbsDisplayIcon,
        badge: cbsBadgeConfig,
    },

    routingHint:
        'נתונים סטטיסטיים רשמיים של הלשכה המרכזית לסטטיסטיקה — סדרות זמן (אוכלוסייה, כלכלה, חינוך, תעסוקה), מדדי מחירים (מדד המחירים לצרכן, מדדי דיור, הצמדה), ומילון יישובים (ערים, מועצות, נפות, מחוזות)',

    tools: CbsTools,
    sourceResolvers: cbsSourceResolvers,
    translations: cbsTranslations,
} satisfies DataSourceDefinition<typeof CbsTools>;

// Re-export tools and types for convenience
export { CbsTools, type CbsToolName, cbsSourceResolvers } from './tools';
export { createCbsAgent } from './cbs.agent';
export { cbsTranslations } from './cbs.translations';
export { cbsDisplayLabel, cbsDisplayIcon, cbsBadgeConfig } from './cbs.display';
