/**
 * Shufersal Data Source Definition
 *
 * Self-contained module for the Shufersal supermarket data source.
 * Satisfies the DataSourceDefinition interface for registry integration.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { ShufersalTools, shufersalSourceConfigs } from './tools';
import {
    createShufersalAgent,
    SHUFERSAL_AGENT_NAME,
    SHUFERSAL_AGENT_DESCRIPTION,
    SHUFERSAL_AGENT_INSTRUCTIONS,
} from './shufersal.agent';
import { shufersalDisplayLabel, shufersalDisplayIcon, shufersalBadgeConfig } from './shufersal.display';
import { shufersalTranslations } from './shufersal.translations';

export const ShufersalDataSource = {
    id: 'shufersal',

    agent: {
        id: 'shufersalAgent',
        name: SHUFERSAL_AGENT_NAME,
        description: SHUFERSAL_AGENT_DESCRIPTION,
        instructions: SHUFERSAL_AGENT_INSTRUCTIONS,
        createAgent: createShufersalAgent,
    },

    display: {
        label: shufersalDisplayLabel,
        icon: shufersalDisplayIcon,
        badge: shufersalBadgeConfig,
    },

    routingHint:
        'מוצרים ומחירים בשופרסל — חיפוש מוצרים לפי שם או ברקוד, מחירים בשקלים, יצרנים ומותגים באתר שופרסל אונליין',

    tools: ShufersalTools,
    sourceResolvers: {},
    translations: shufersalTranslations,
} satisfies DataSourceDefinition<typeof ShufersalTools>;

// Re-export tools and types for convenience
export { ShufersalTools, type ShufersalToolName, shufersalSourceConfigs } from './tools';
export { createShufersalAgent } from './shufersal.agent';
export { shufersalTranslations } from './shufersal.translations';
export { shufersalDisplayLabel, shufersalDisplayIcon, shufersalBadgeConfig } from './shufersal.display';
