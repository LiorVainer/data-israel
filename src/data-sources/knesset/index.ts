/**
 * Knesset Data Source Definition
 *
 * Self-contained module for the Israeli Knesset (Parliament) data source.
 * Satisfies the DataSourceDefinition interface for registry integration.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { KnessetTools, knessetSourceConfigs } from './tools';
import {
    createKnessetAgent,
    KNESSET_AGENT_NAME,
    KNESSET_AGENT_DESCRIPTION,
    KNESSET_AGENT_INSTRUCTIONS,
} from './knesset.agent';
import { knessetDisplayLabel, knessetDisplayIcon, knessetBadgeConfig } from './knesset.display';
import { knessetTranslations } from './knesset.translations';

export const KnessetDataSource = {
    id: 'knesset',

    agent: {
        id: 'knessetAgent',
        name: KNESSET_AGENT_NAME,
        description: KNESSET_AGENT_DESCRIPTION,
        instructions: KNESSET_AGENT_INSTRUCTIONS,
        createAgent: createKnessetAgent,
    },

    display: {
        label: knessetDisplayLabel,
        icon: knessetDisplayIcon,
        badge: knessetBadgeConfig,
    },

    routingHint: 'נתוני הכנסת — הצעות חוק, ועדות כנסת, חברי כנסת, ותהליכי חקיקה מה-API הפתוח של הכנסת',

    tools: KnessetTools,
    sourceConfigs: knessetSourceConfigs,
    translations: knessetTranslations,
} satisfies DataSourceDefinition<typeof KnessetTools>;

// Re-export tools and types for convenience
export { KnessetTools, type KnessetToolName, knessetSourceConfigs } from './tools';
export { createKnessetAgent } from './knesset.agent';
export { knessetTranslations } from './knesset.translations';
export { knessetDisplayLabel, knessetDisplayIcon, knessetBadgeConfig } from './knesset.display';
