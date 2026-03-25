/**
 * Nadlan Data Source Definition
 *
 * Self-contained module for the Israeli real estate (Nadlan) data source.
 * Satisfies the DataSourceDefinition interface for registry integration.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { NadlanTools, nadlanSourceResolvers } from './tools';
import {
    createNadlanAgent,
    NADLAN_AGENT_NAME,
    NADLAN_AGENT_DESCRIPTION,
    NADLAN_AGENT_INSTRUCTIONS,
} from './nadlan.agent';
import { nadlanDisplayLabel, nadlanDisplayIcon, nadlanBadgeConfig } from './nadlan.display';
import { nadlanTranslations } from './nadlan.translations';

export const NadlanDataSource = {
    id: 'nadlan',

    agent: {
        id: 'nadlanAgent',
        name: NADLAN_AGENT_NAME,
        description: NADLAN_AGENT_DESCRIPTION,
        instructions: NADLAN_AGENT_INSTRUCTIONS,
        createAgent: createNadlanAgent,
    },

    display: {
        label: nadlanDisplayLabel,
        icon: nadlanDisplayIcon,
        badge: nadlanBadgeConfig,
    },

    routingHint:
        'נתוני עסקאות נדל"ן בישראל ממערכת govmap — חיפוש עסקאות לפי כתובת, מחירים למ"ר, מגמות שוק, הערכת שווי נכסים, והשוואת שכונות ורחובות',

    tools: NadlanTools,
    sourceResolvers: nadlanSourceResolvers,
    translations: nadlanTranslations,
} satisfies DataSourceDefinition<typeof NadlanTools>;

// Re-export tools and types for convenience
export { NadlanTools, type NadlanToolName, nadlanSourceResolvers } from './tools';
export { createNadlanAgent } from './nadlan.agent';
export { nadlanTranslations } from './nadlan.translations';
export { nadlanDisplayLabel, nadlanDisplayIcon, nadlanBadgeConfig } from './nadlan.display';
