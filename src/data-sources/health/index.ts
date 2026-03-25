/**
 * Health Data Source Definition
 *
 * Self-contained module for the Israeli Ministry of Health data dashboard.
 * Satisfies the DataSourceDefinition interface for registry integration.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { HealthTools, healthSourceResolvers } from './tools';
import {
    createHealthAgent,
    HEALTH_AGENT_NAME,
    HEALTH_AGENT_DESCRIPTION,
    HEALTH_AGENT_INSTRUCTIONS,
} from './health.agent';
import { healthDisplayLabel, healthDisplayIcon, healthBadgeConfig } from './health.display';
import { healthTranslations } from './health.translations';

export const HealthDataSource = {
    id: 'health',

    agent: {
        id: 'healthAgent',
        name: HEALTH_AGENT_NAME,
        description: HEALTH_AGENT_DESCRIPTION,
        instructions: HEALTH_AGENT_INSTRUCTIONS,
        createAgent: createHealthAgent,
    },

    display: {
        label: healthDisplayLabel,
        icon: healthDisplayIcon,
        badge: healthBadgeConfig,
    },

    routingHint:
        'נתוני בריאות ציבורית ממשרד הבריאות — נפגעי מלחמה, שירותי רפואה, איכות חופים, מבוטחי קופות חולים, חיסוני ילדים, בדיקות התפתחותיות ואיכות שירות',

    tools: HealthTools,
    sourceResolvers: healthSourceResolvers,
    translations: healthTranslations,
} satisfies DataSourceDefinition<typeof HealthTools>;

// Re-export tools and types for convenience
export { HealthTools, type HealthToolName, healthSourceResolvers } from './tools';
export { createHealthAgent } from './health.agent';
export { healthTranslations } from './health.translations';
export { healthDisplayLabel, healthDisplayIcon, healthBadgeConfig } from './health.display';
