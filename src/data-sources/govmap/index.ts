/**
 * GovMap Data Source Definition
 *
 * Self-contained module for the GovMap geospatial data source.
 * Satisfies the DataSourceDefinition interface for registry integration.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { GovmapTools, govmapSourceConfigs } from './tools';
import {
    createGovmapAgent,
    GOVMAP_AGENT_NAME,
    GOVMAP_AGENT_DESCRIPTION,
    GOVMAP_AGENT_INSTRUCTIONS,
} from './govmap.agent';
import { govmapDisplayLabel, govmapDisplayIcon, govmapBadgeConfig } from './govmap.display';
import { govmapTranslations } from './govmap.translations';

export const GovmapDataSource = {
    id: 'govmap',

    agent: {
        id: 'govmapAgent',
        name: GOVMAP_AGENT_NAME,
        description: GOVMAP_AGENT_DESCRIPTION,
        instructions: GOVMAP_AGENT_INSTRUCTIONS,
        createAgent: createGovmapAgent,
    },

    display: {
        label: govmapDisplayLabel,
        icon: govmapDisplayIcon,
        badge: govmapBadgeConfig,
    },

    routingHint:
        'נתוני GovMap — פורטל המפות הממשלתי של ישראל. כולל: נדל"ן (עסקאות, מחירים, מגמות, הערכת שווי), שירותים ציבוריים (בתי חולים, משטרה, כיבוי, מד"א, בנקים, תחנות דלק ואוטובוס ליד כתובת), מידע קרקעי (גוש, חלקה, שכונה), תיירות (מלונות, צימרים, אטרקציות, יקבים, עתיקות, ספורט), ומידע אזורי (דמוגרפיה, מחוז, אזור טבעי)',

    tools: GovmapTools,
    sourceConfigs: govmapSourceConfigs,
    translations: govmapTranslations,
} satisfies DataSourceDefinition<typeof GovmapTools>;

// Re-export tools and types for convenience
export { GovmapTools, type GovmapToolName, govmapSourceConfigs } from './tools';
export { createGovmapAgent } from './govmap.agent';
export { govmapTranslations } from './govmap.translations';
export { govmapDisplayLabel, govmapDisplayIcon, govmapBadgeConfig } from './govmap.display';
