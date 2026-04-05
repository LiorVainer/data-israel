/**
 * Rami Levy Data Source Definition
 *
 * Self-contained module for the Rami Levy supermarket data source.
 * Satisfies the DataSourceDefinition interface for registry integration.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { ShoppingCartIcon, TagIcon } from 'lucide-react';
import { RamiLevyTools, ramiLevySourceConfigs } from './tools';
import {
    createRamiLevyAgent,
    RAMI_LEVY_AGENT_NAME,
    RAMI_LEVY_AGENT_DESCRIPTION,
    RAMI_LEVY_AGENT_INSTRUCTIONS,
} from './rami-levy.agent';
import { ramiLevyDisplayLabel, ramiLevyDisplayIcon, ramiLevyBadgeConfig } from './rami-levy.display';
import { ramiLevyTranslations } from './rami-levy.translations';

export const RamiLevyDataSource = {
    id: 'rami-levy',

    agent: {
        id: 'ramiLevyAgent',
        name: RAMI_LEVY_AGENT_NAME,
        description: RAMI_LEVY_AGENT_DESCRIPTION,
        instructions: RAMI_LEVY_AGENT_INSTRUCTIONS,
        createAgent: createRamiLevyAgent,
    },

    display: {
        label: ramiLevyDisplayLabel,
        icon: ramiLevyDisplayIcon,
        badge: ramiLevyBadgeConfig,
    },

    routingHint: 'מחירי מוצרים ברמי לוי — חיפוש מוצרים לפי שם או ברקוד, מחירים, מותגים, ומחלקות בקטלוג רמי לוי אונליין',

    tools: RamiLevyTools,
    sourceResolvers: {},
    translations: ramiLevyTranslations,

    landing: {
        logo: '/rami-levy-logo.png',
        description: 'רמי לוי — חיפוש מוצרים ומחירים בקטלוג הסופרמרקט',
        stats: [
            { label: 'מוצרים', value: '30K+', icon: ShoppingCartIcon },
            { label: 'כלים', value: '2', icon: TagIcon },
        ],
        category: 'economy',
        order: 5,
    },

    suggestions: {
        prompts: [
            {
                label: 'מחירי חלב ברמי לוי',
                prompt: 'כמה עולה חלב תנובה 3% ברמי לוי?',
                icon: ShoppingCartIcon,
            },
            {
                label: 'חיפוש מוצר ברמי לוי',
                prompt: 'חפש קוטג׳ 5% ברמי לוי',
                icon: TagIcon,
            },
        ],
    },
} satisfies DataSourceDefinition<typeof RamiLevyTools>;

// Re-export tools and types for convenience
export { RamiLevyTools, type RamiLevyToolName, ramiLevySourceConfigs } from './tools';
export { createRamiLevyAgent } from './rami-levy.agent';
export { ramiLevyTranslations } from './rami-levy.translations';
export { ramiLevyDisplayLabel, ramiLevyDisplayIcon, ramiLevyBadgeConfig } from './rami-levy.display';
