/**
 * Drugs Data Source Definition
 *
 * Self-contained module for the Israeli Ministry of Health drug registry.
 * Satisfies the DataSourceDefinition interface for registry integration.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { DrugsTools, drugsSourceResolvers } from './tools';
import { createDrugsAgent, DRUGS_AGENT_NAME, DRUGS_AGENT_DESCRIPTION, DRUGS_AGENT_INSTRUCTIONS } from './drugs.agent';
import { drugsDisplayLabel, drugsDisplayIcon, drugsBadgeConfig } from './drugs.display';
import { drugsTranslations } from './drugs.translations';

export const DrugsDataSource = {
    id: 'drugs',

    agent: {
        id: 'drugsAgent',
        name: DRUGS_AGENT_NAME,
        description: DRUGS_AGENT_DESCRIPTION,
        instructions: DRUGS_AGENT_INSTRUCTIONS,
        createAgent: createDrugsAgent,
    },

    display: {
        label: drugsDisplayLabel,
        icon: drugsDisplayIcon,
        badge: drugsBadgeConfig,
    },

    routingHint:
        'מאגר התרופות של משרד הבריאות — חיפוש תרופות לפי שם, סימפטום, חומר פעיל או קוד ATC, פרטי תרופה מקיפים, חלופות גנריות, סל בריאות ומחירים',

    tools: DrugsTools,
    sourceResolvers: drugsSourceResolvers,
    translations: drugsTranslations,
} satisfies DataSourceDefinition<typeof DrugsTools>;

// Re-export tools and types for convenience
export { DrugsTools, type DrugsToolName, drugsSourceResolvers } from './tools';
export { createDrugsAgent } from './drugs.agent';
export { drugsTranslations } from './drugs.translations';
export { drugsDisplayLabel, drugsDisplayIcon, drugsBadgeConfig } from './drugs.display';
