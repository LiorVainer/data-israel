/**
 * Grocery Data Source Definition
 *
 * Self-contained module for Israeli supermarket price data.
 * Satisfies the DataSourceDefinition interface for registry integration.
 *
 * Data sourced from XML price feeds under the Israeli Price Transparency Law (2015).
 * Landing category: economy, order: 3.
 */

import type { DataSourceDefinition } from '@/data-sources/types';
import { GroceryTools, grocerySourceResolvers } from './tools';
import {
    createGroceryAgent,
    GROCERY_AGENT_NAME,
    GROCERY_AGENT_DESCRIPTION,
    GROCERY_AGENT_INSTRUCTIONS,
} from './grocery.agent';
import { groceryDisplayLabel, groceryDisplayIcon, groceryBadgeConfig } from './grocery.display';
import { groceryTranslations } from './grocery.translations';

export const GroceryDataSource = {
    id: 'grocery',

    agent: {
        id: 'groceryAgent',
        name: GROCERY_AGENT_NAME,
        description: GROCERY_AGENT_DESCRIPTION,
        instructions: GROCERY_AGENT_INSTRUCTIONS,
        createAgent: createGroceryAgent,
    },

    display: {
        label: groceryDisplayLabel,
        icon: groceryDisplayIcon,
        badge: groceryBadgeConfig,
    },

    routingHint:
        'מחירי מזון בסופרמרקטים — חיפוש מוצרים לפי ברקוד או שם, השוואת מחירים בין רשתות (שופרסל, רמי לוי, יוחננוף, ויקטורי, אושר עד, טיב טעם), סניפים, ומבצעים. נתונים לפי חוק שקיפות מחירים 2015.',

    tools: GroceryTools,
    sourceResolvers: grocerySourceResolvers,
    translations: groceryTranslations,
} satisfies DataSourceDefinition<typeof GroceryTools>;

// Re-export tools and types for convenience
export { GroceryTools, type GroceryToolName, grocerySourceResolvers } from './tools';
export { createGroceryAgent } from './grocery.agent';
export { groceryTranslations } from './grocery.translations';
export { groceryDisplayLabel, groceryDisplayIcon, groceryBadgeConfig } from './grocery.display';
