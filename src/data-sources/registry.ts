/**
 * Data Source Registry
 *
 * Central registry that collects all data source definitions and provides:
 * - Merged tools object for type derivation
 * - Unified translations (per-source + auto-generated agent entries)
 * - Source URL resolution (map lookup, no switch)
 * - Tool → data source lookup
 * - Routing hints for the routing agent's system prompt
 * - Agent references for Mastra registration
 *
 * IMPORTANT: This module is imported by client components (e.g., MessageItem.tsx).
 * All agent-related imports (createAgent, @mastra/core/agent) are isolated in
 * registry.server.ts to avoid pulling Node.js-only Mastra code into the browser bundle.
 */

import type {
    ToolTranslation,
    ToolSourceResolver,
    ToolResourceExtractor,
    DataSourceConfig,
    AgentDisplayInfo,
    DataSource,
    LandingConfig,
    SuggestionsConfig,
} from './types';
import {
    ActivityIcon,
    DatabaseIcon,
    BuildingIcon,
    FileIcon,
    TrendingUpIcon,
    LayersIcon,
    CalendarIcon,
    LandmarkIcon,
    GavelIcon,
    HomeIcon,
    PillIcon,
    HeartPulseIcon,
    ShoppingCartIcon,
    ScrollTextIcon,
    UsersIcon,
    BarChart3Icon,
    StethoscopeIcon,
    TagIcon,
    SearchIcon,
    ShieldCheckIcon,
} from 'lucide-react';

// Client-safe imports — tools, translations, display, resolvers (no Agent dependency)
import { CbsTools, cbsSourceResolvers, cbsResourceExtractors } from './cbs/tools';
import { cbsTranslations } from './cbs/cbs.translations';
import { cbsDisplayLabel, cbsDisplayIcon, cbsBadgeConfig } from './cbs/cbs.display';

import { DataGovTools, datagovSourceResolvers, datagovResourceExtractors } from './datagov/tools';
import { datagovTranslations } from './datagov/datagov.translations';
import { datagovAgentDisplay, datagovBadgeConfig } from './datagov/datagov.display';

import { BudgetToolNames } from './budget/budget.tools';
import { budgetTranslations } from './budget/budget.translations';
import { budgetDisplayLabel, budgetDisplayIcon, budgetBadgeConfig } from './budget/budget.display';
import { budgetSourceResolvers } from './budget/budget.source-resolvers';

import { NadlanTools, nadlanSourceResolvers } from './nadlan/tools';
import { nadlanTranslations } from './nadlan/nadlan.translations';
import { nadlanDisplayLabel, nadlanDisplayIcon, nadlanBadgeConfig } from './nadlan/nadlan.display';

import { DrugsTools, drugsSourceResolvers } from './drugs/tools';
import { drugsTranslations } from './drugs/drugs.translations';
import { drugsDisplayLabel, drugsDisplayIcon, drugsBadgeConfig } from './drugs/drugs.display';

import { HealthTools, healthSourceResolvers } from './health/tools';
import { healthTranslations } from './health/health.translations';
import { healthDisplayLabel, healthDisplayIcon, healthBadgeConfig } from './health/health.display';

import { GroceryTools, grocerySourceResolvers } from './grocery/tools';
import { groceryTranslations } from './grocery/grocery.translations';
import { groceryDisplayLabel, groceryDisplayIcon, groceryBadgeConfig } from './grocery/grocery.display';

import { KnessetTools, knessetSourceResolvers } from './knesset/tools';
import { knessetTranslations } from './knesset/knesset.translations';
import { knessetDisplayLabel, knessetDisplayIcon, knessetBadgeConfig } from './knesset/knesset.display';

import { ShufersalTools, shufersalSourceResolvers } from './shufersal/tools';
import { shufersalTranslations } from './shufersal/shufersal.translations';
import { shufersalDisplayLabel, shufersalDisplayIcon, shufersalBadgeConfig } from './shufersal/shufersal.display';

import { RamiLevyTools, ramiLevySourceResolvers } from './rami-levy/tools';
import { ramiLevyTranslations } from './rami-levy/rami-levy.translations';
import { ramiLevyDisplayLabel, ramiLevyDisplayIcon, ramiLevyBadgeConfig } from './rami-levy/rami-levy.display';

import { clientTranslations } from '@/lib/tools/client/translations';

// ============================================================================
// Derived Types
// ============================================================================

/** Union of all data source IDs — re-exports DataSource from display.types for consistency */
export type DataSourceId = DataSource;

// ============================================================================
// Static Data Source Metadata (client-safe — no Agent imports)
// ============================================================================

interface DataSourceMeta {
    id: DataSourceId;
    agentId: string;
    display: { label: string; icon: typeof ActivityIcon; badge: DataSourceConfig };
    routingHint: string;
    tools: Record<string, unknown>;
    sourceResolvers: Record<string, ToolSourceResolver>;
    translations: Record<string, ToolTranslation>;
    resourceExtractors: Record<string, ToolResourceExtractor>;
    /** Optional landing page display config */
    landing?: LandingConfig;
    /** Optional example prompts for empty conversation */
    suggestions?: SuggestionsConfig;
}

const DATA_SOURCE_METAS: readonly DataSourceMeta[] = [
    {
        id: 'cbs',
        agentId: 'cbsAgent',
        display: { label: cbsDisplayLabel, icon: cbsDisplayIcon, badge: cbsBadgeConfig },
        routingHint:
            'נתונים סטטיסטיים רשמיים של הלשכה המרכזית לסטטיסטיקה — סדרות זמן (אוכלוסייה, כלכלה, חינוך, תעסוקה), מדדי מחירים (מדד המחירים לצרכן, מדדי דיור, הצמדה), ומילון יישובים (ערים, מועצות, נפות, מחוזות)',
        tools: CbsTools,
        sourceResolvers: cbsSourceResolvers as Record<string, ToolSourceResolver>,
        translations: cbsTranslations as Record<string, ToolTranslation>,
        resourceExtractors: cbsResourceExtractors as Record<string, ToolResourceExtractor>,
        landing: {
            logo: '/cbs-logo.svg',
            description: 'הלשכה המרכזית לסטטיסטיקה — סדרות סטטיסטיות, מדדי מחירים ונתוני אוכלוסין',
            stats: [
                { label: 'סדרות', value: '2,000+', icon: TrendingUpIcon },
                { label: 'נושאים', value: '30+', icon: LayersIcon },
                { label: 'שנות נתונים', value: '75+', icon: CalendarIcon },
            ],
            category: 'economy',
            order: 1,
        },
        suggestions: {
            prompts: [
                {
                    label: 'מדד המחירים לצרכן',
                    prompt: 'איך השתנה מדד המחירים לצרכן בשנה האחרונה?',
                    icon: TrendingUpIcon,
                },
                { label: 'אוכלוסייה לפי יישוב', prompt: 'מה נתוני האוכלוסייה העדכניים לפי יישוב?', icon: UsersIcon },
            ],
        },
    },
    {
        id: 'datagov',
        agentId: 'datagovAgent',
        display: { label: datagovAgentDisplay.label, icon: datagovAgentDisplay.icon, badge: datagovBadgeConfig },
        routingHint:
            'נתוני ממשל פתוחים מאתר data.gov.il — מאגרי נתונים, ארגונים, קבוצות, תגיות, משאבים ושאילתות DataStore.',
        tools: DataGovTools,
        sourceResolvers: datagovSourceResolvers as Record<string, ToolSourceResolver>,
        translations: datagovTranslations as Record<string, ToolTranslation>,
        resourceExtractors: datagovResourceExtractors as Record<string, ToolResourceExtractor>,
        landing: {
            logo: '/datagov-logo.svg',
            description: 'פורטל הנתונים הפתוחים של ממשלת ישראל — מאגרי מידע, ארגונים וקבצים',
            stats: [
                { label: 'מאגרי מידע', value: '1,500+', icon: DatabaseIcon },
                { label: 'ארגונים', value: '80+', icon: BuildingIcon },
                { label: 'קבצים', value: '10,000+', icon: FileIcon },
            ],
            category: 'government',
            order: 1,
        },
        suggestions: {
            prompts: [
                { label: 'מאגרים על תחבורה', prompt: 'אילו מאגרי מידע פתוחים יש על תחבורה ותשתיות?', icon: SearchIcon },
                {
                    label: 'ארגונים מפרסמים',
                    prompt: 'מה הארגונים הממשלתיים שמפרסמים הכי הרבה מאגרים?',
                    icon: BuildingIcon,
                },
            ],
        },
    },
    {
        id: 'budget',
        agentId: 'budgetAgent',
        display: { label: budgetDisplayLabel, icon: budgetDisplayIcon, badge: budgetBadgeConfig },
        routingHint:
            'נתוני תקציב המדינה של ישראל מפרויקט מפתח התקציב — ספר התקציב (הוצאות מתוכננות ומבוצעות 1997-2025), תוכניות תמיכה תקציביות, התקשרויות רכש ממשלתיות, מכרזים, ישויות (חברות, עמותות, רשויות), הכנסות המדינה, ובקשות לשינויי תקציב.',
        tools: BudgetToolNames as Record<string, unknown>,
        sourceResolvers: budgetSourceResolvers as Record<string, ToolSourceResolver>,
        translations: budgetTranslations as Record<string, ToolTranslation>,
        resourceExtractors: {},
        landing: {
            logo: '/budget-logo.svg',
            description: 'תקציב המדינה — הוצאות, הכנסות, התקשרויות, תמיכות ומכרזים (1997-2025)',
            stats: [
                { label: 'מאגרי נתונים', value: '8', icon: DatabaseIcon },
                { label: 'שנות תקציב', value: '28', icon: CalendarIcon },
                { label: 'שאילתות', value: 'SQL', icon: ScrollTextIcon },
            ],
            category: 'government',
            order: 2,
        },
        suggestions: {
            prompts: [
                { label: 'תקציב משרד החינוך', prompt: 'כמה תקציב הוקצה למשרד החינוך ב-2025?', icon: LandmarkIcon },
                { label: 'התקשרויות רכש', prompt: 'אילו התקשרויות רכש ביצע משרד הביטחון?', icon: ScrollTextIcon },
            ],
        },
    },
    {
        id: 'nadlan',
        agentId: 'nadlanAgent',
        display: { label: nadlanDisplayLabel, icon: nadlanDisplayIcon, badge: nadlanBadgeConfig },
        routingHint:
            'נתוני עסקאות נדל"ן בישראל ממערכת govmap — חיפוש עסקאות לפי כתובת, מחירים למ"ר, מגמות שוק, הערכת שווי נכסים, והשוואת שכונות ורחובות',
        tools: NadlanTools,
        sourceResolvers: nadlanSourceResolvers as Record<string, ToolSourceResolver>,
        translations: nadlanTranslations as Record<string, ToolTranslation>,
        resourceExtractors: {},
        landing: {
            logo: '/nadlan-logo.svg',
            description: 'עסקאות נדל"ן בישראל — מחירים, מגמות שוק, הערכות שווי ונתוני שכונות',
            stats: [
                { label: 'כלים', value: '8', icon: HomeIcon },
                { label: 'נתוני עסקאות', value: '100K+', icon: BarChart3Icon },
                { label: 'ערים', value: '250+', icon: UsersIcon },
            ],
            category: 'economy',
            order: 2,
        },
        suggestions: {
            prompts: [
                { label: 'מחירי דירות בת"א', prompt: 'מה מחירי הדירות בתל אביב בשנה האחרונה?', icon: HomeIcon },
                { label: 'השוואת ערים', prompt: 'השווה מחירי נדל"ן בין רמת גן לגבעתיים', icon: BarChart3Icon },
            ],
        },
    },
    {
        id: 'drugs',
        agentId: 'drugsAgent',
        display: { label: drugsDisplayLabel, icon: drugsDisplayIcon, badge: drugsBadgeConfig },
        routingHint:
            'מאגר התרופות של משרד הבריאות — חיפוש תרופות לפי שם, סימפטום, חומר פעיל או קוד ATC, פרטי תרופה מקיפים, חלופות גנריות, סל בריאות ומחירים',
        tools: DrugsTools,
        sourceResolvers: drugsSourceResolvers as Record<string, ToolSourceResolver>,
        translations: drugsTranslations as Record<string, ToolTranslation>,
        resourceExtractors: {},
        landing: {
            logo: '/drugs-logo.svg',
            description: 'מאגר התרופות של משרד הבריאות — תרופות, חלופות גנריות, סל בריאות וקופות חולים',
            stats: [
                { label: 'קטגוריות ATC', value: '1,172', icon: PillIcon },
                { label: 'כלים', value: '8', icon: TagIcon },
                { label: 'שפות', value: '4', icon: UsersIcon },
            ],
            category: 'health',
            order: 1,
        },
        suggestions: {
            prompts: [
                { label: 'חלופות גנריות', prompt: 'מהן החלופות הגנריות לאקמול?', icon: PillIcon },
                { label: 'סל בריאות', prompt: 'אילו תרופות מכוסות בסל הבריאות לסוכרת?', icon: HeartPulseIcon },
            ],
        },
    },
    {
        id: 'health',
        agentId: 'healthAgent',
        display: { label: healthDisplayLabel, icon: healthDisplayIcon, badge: healthBadgeConfig },
        routingHint:
            'נתוני בריאות ציבורית ממשרד הבריאות — נפגעי מלחמה, שירותי רפואה, איכות חופים, מבוטחי קופות חולים, חיסוני ילדים, בדיקות התפתחותיות ואיכות שירות',
        tools: HealthTools,
        sourceResolvers: healthSourceResolvers as Record<string, ToolSourceResolver>,
        translations: healthTranslations as Record<string, ToolTranslation>,
        resourceExtractors: {},
        landing: {
            logo: '/health-logo.svg',
            description: 'דשבורד הבריאות של משרד הבריאות — קופות חולים, איכות שירות, בדיקות ילדים ועוד',
            stats: [
                { label: 'נושאים', value: '7', icon: StethoscopeIcon },
                { label: 'כלים', value: '5', icon: HeartPulseIcon },
                { label: 'מקור', value: 'משה"ב', icon: BuildingIcon },
            ],
            category: 'health',
            order: 2,
        },
        suggestions: {
            prompts: [
                {
                    label: 'איכות שירות בתי חולים',
                    prompt: 'מה איכות השירות בבתי החולים בישראל?',
                    icon: StethoscopeIcon,
                },
                { label: 'חיסוני ילדים', prompt: 'מה שיעור חיסוני הילדים לפי קופת חולים?', icon: ShieldCheckIcon },
            ],
        },
    },
    {
        id: 'grocery',
        agentId: 'groceryAgent',
        display: { label: groceryDisplayLabel, icon: groceryDisplayIcon, badge: groceryBadgeConfig },
        routingHint:
            'מחירי מזון בסופרמרקטים — חיפוש מוצרים לפי ברקוד או שם, השוואת מחירים בין רשתות (שופרסל, רמי לוי, יוחננוף, ויקטורי, אושר עד, טיב טעם), סניפים, ומבצעים. נתונים לפי חוק שקיפות מחירים 2015.',
        tools: GroceryTools,
        sourceResolvers: grocerySourceResolvers as Record<string, ToolSourceResolver>,
        translations: groceryTranslations as Record<string, ToolTranslation>,
        resourceExtractors: {},
        landing: {
            logo: '/grocery-logo.svg',
            description: 'מחירי מזון בסופרמרקטים — השוואת מחירים, מבצעים וסניפים ב-7 רשתות',
            stats: [
                { label: 'רשתות', value: '7', icon: ShoppingCartIcon },
                { label: 'עדכון יומי', value: '24h', icon: CalendarIcon },
                { label: 'מוצרים', value: '50K+', icon: TagIcon },
            ],
            category: 'economy',
            order: 3,
        },
        suggestions: {
            prompts: [
                {
                    label: 'השוואת מחירי חלב',
                    prompt: 'כמה עולה חלב תנובה 3% בשופרסל לעומת רמי לוי?',
                    icon: ShoppingCartIcon,
                },
                { label: 'סל קניות בסיסי', prompt: 'השווה מחירי סל קניות בסיסי בין הרשתות', icon: TagIcon },
            ],
        },
    },
    {
        id: 'knesset',
        agentId: 'knessetAgent',
        display: { label: knessetDisplayLabel, icon: knessetDisplayIcon, badge: knessetBadgeConfig },
        routingHint: 'נתוני הכנסת — הצעות חוק, ועדות כנסת, חברי כנסת, ותהליכי חקיקה מה-API הפתוח של הכנסת',
        tools: KnessetTools,
        sourceResolvers: knessetSourceResolvers as Record<string, ToolSourceResolver>,
        translations: knessetTranslations as Record<string, ToolTranslation>,
        resourceExtractors: {},
        landing: {
            logo: '/knesset-logo.svg',
            description: 'הכנסת — הצעות חוק, ועדות, חברי כנסת ותהליכי חקיקה',
            stats: [
                { label: 'כלים', value: '7', icon: GavelIcon },
                { label: 'כנסות', value: '25', icon: LandmarkIcon },
                { label: 'נתונים', value: 'OData', icon: DatabaseIcon },
            ],
            category: 'government',
            order: 3,
        },
        suggestions: {
            prompts: [
                { label: 'הצעות חוק', prompt: 'אילו הצעות חוק עברו בכנסת ה-25?', icon: GavelIcon },
                { label: 'ועדת הכספים', prompt: 'מי חברי ועדת הכספים של הכנסת?', icon: UsersIcon },
            ],
        },
    },
    {
        id: 'shufersal',
        agentId: 'shufersalAgent',
        display: { label: shufersalDisplayLabel, icon: shufersalDisplayIcon, badge: shufersalBadgeConfig },
        routingHint:
            'מוצרים ומחירים בשופרסל — חיפוש מוצרים לפי שם או ברקוד, מחירים בשקלים, יצרנים ומותגים באתר שופרסל אונליין',
        tools: ShufersalTools,
        sourceResolvers: shufersalSourceResolvers as Record<string, ToolSourceResolver>,
        translations: shufersalTranslations as Record<string, ToolTranslation>,
        resourceExtractors: {},
        landing: {
            logo: '/shufersal-logo.svg',
            description: 'שופרסל אונליין — חיפוש מוצרים, מחירים, יצרנים ומותגים ברשת הגדולה בישראל',
            stats: [
                { label: 'מוצרים', value: '30K+', icon: ShoppingCartIcon },
                { label: 'עדכון', value: 'יומי', icon: CalendarIcon },
                { label: 'כלים', value: '2', icon: TagIcon },
            ],
            category: 'economy',
            order: 4,
        },
        suggestions: {
            prompts: [
                {
                    label: 'חיפוש מוצר בשופרסל',
                    prompt: 'כמה עולה חלב תנובה 3% בשופרסל?',
                    icon: ShoppingCartIcon,
                },
                { label: 'מוצרי שופרסל', prompt: 'חפש לי שמן זית בשופרסל אונליין', icon: SearchIcon },
            ],
        },
    },
] as const;

// ============================================================================
// Merged Tools
// ============================================================================

/** All tools from all data sources — used for type derivation in agents/types.ts */
export const allDataSourceTools = {
    ...CbsTools,
    ...DataGovTools,
    ...BudgetToolNames,
    ...NadlanTools,
    ...DrugsTools,
    ...HealthTools,
    ...GroceryTools,
    ...KnessetTools,
    ...ShufersalTools,
} as const;

// ============================================================================
// Badge / Display Config
// ============================================================================

/** Badge configuration record keyed by data source ID */
export const DATA_SOURCE_CONFIG: Record<DataSourceId, DataSourceConfig> = Object.fromEntries(
    DATA_SOURCE_METAS.map((ds) => [ds.id, ds.display.badge]),
) as Record<DataSourceId, DataSourceConfig>;

// ============================================================================
// Landing Page Data
// ============================================================================

/** Return data sources that have a full landing page config (logo, description, stats). */
export function getDataSourcesWithLanding() {
    return DATA_SOURCE_METAS.filter((meta): meta is DataSourceMeta & { landing: LandingConfig } => !!meta.landing).map(
        (meta) => ({
            id: meta.id,
            landing: meta.landing,
            badge: meta.display.badge,
            display: { label: meta.display.label, icon: meta.display.icon },
        }),
    );
}

// ============================================================================
// Suggestions Data
// ============================================================================

/** Return data sources that have suggestion prompts and a landing config (for category grouping). */
export function getDataSourcesWithSuggestions() {
    return DATA_SOURCE_METAS.filter(
        (meta): meta is DataSourceMeta & { suggestions: SuggestionsConfig; landing: LandingConfig } =>
            !!meta.suggestions?.prompts.length && !!meta.landing,
    ).map((meta) => ({
        id: meta.id,
        label: meta.display.label,
        icon: meta.suggestions.icon ?? meta.display.icon,
        color: meta.suggestions.color,
        badge: meta.display.badge,
        category: meta.landing.category,
        prompts: meta.suggestions.prompts,
    }));
}

// ============================================================================
// Agent Display Map
// ============================================================================

/** Display metadata for all agents — derived from data source definitions + routing agent */
export const AgentsDisplayMap: Record<string, AgentDisplayInfo> = {
    routingAgent: { label: 'סוכן הניתוב', icon: ActivityIcon },
    ...Object.fromEntries(
        DATA_SOURCE_METAS.map((ds) => [
            ds.agentId,
            { label: ds.display.label, icon: ds.display.icon, dataSource: ds.id },
        ]),
    ),
};

// ============================================================================
// Tool → Data Source Lookup
// ============================================================================

/** Pre-built map: tool name → data source ID */
const toolToDataSourceMap = new Map<string, DataSourceId>();
for (const ds of DATA_SOURCE_METAS) {
    for (const toolName of Object.keys(ds.tools)) {
        toolToDataSourceMap.set(toolName, ds.id);
    }
    // Also map agent-as-tool key
    toolToDataSourceMap.set(`agent-${ds.agentId}`, ds.id);
}

/**
 * Get the data source ID for a tool by its key (without 'tool-' prefix).
 * Also handles agent-as-tool keys like 'agent-cbsAgent'.
 */
export function getToolDataSource(toolKey: string): DataSourceId | undefined {
    return toolToDataSourceMap.get(toolKey);
}

/**
 * Get the badge configuration for a tool's data source.
 */
export function getToolDataSourceConfig(toolKey: string): DataSourceConfig | undefined {
    const source = getToolDataSource(toolKey);
    return source ? DATA_SOURCE_CONFIG[source] : undefined;
}

// ============================================================================
// Source URL Resolution
// ============================================================================

/** Pre-built map: 'tool-{toolName}' → resolver function */
const resolverMap = new Map<string, ToolSourceResolver>();
for (const ds of DATA_SOURCE_METAS) {
    for (const [toolName, resolver] of Object.entries(ds.sourceResolvers)) {
        if (resolver) {
            resolverMap.set(`tool-${toolName}`, resolver);
        }
    }
}

/**
 * Resolve a source URL from a tool's part type, input, and output.
 * Returns null if no resolver exists for the tool or if the resolver returns null.
 */
export function resolveToolSourceUrl(
    toolType: string,
    input: unknown,
    output: unknown,
): ReturnType<ToolSourceResolver> {
    const resolver = resolverMap.get(toolType);
    if (!resolver) return null;
    return resolver(input, output);
}

// ============================================================================
// Translations
// ============================================================================

/**
 * Get all tool translations — merges per-source translations and auto-generates
 * agent-as-tool entries using display.label and display.icon.
 */
export function getAllTranslations(): Record<string, ToolTranslation> {
    const result: Record<string, ToolTranslation> = {};

    for (const ds of DATA_SOURCE_METAS) {
        // Per-source tool translations
        for (const [toolName, translation] of Object.entries(ds.translations)) {
            if (translation) {
                result[toolName] = translation;
            }
        }

        // Auto-generated agent-as-tool translation
        const agentKey = `agent-${ds.agentId}`;
        result[agentKey] = {
            name: ds.display.label,
            icon: ds.display.icon,
            formatInput: (input: unknown) => {
                const i = input as Record<string, unknown> | undefined;
                if (i && typeof i.prompt === 'string') return i.prompt;
                return undefined;
            },
            formatOutput: (output: unknown) => {
                const o = output as Record<string, unknown> | undefined;
                if (o && typeof o.text === 'string') return o.text;
                return 'הושלם';
            },
        };
    }

    // Client tool translations (charts, suggestions)
    for (const [toolName, translation] of Object.entries(clientTranslations)) {
        if (translation) {
            result[toolName] = translation;
        }
    }

    return result;
}

// ============================================================================
// Resource Extractors
// ============================================================================

/**
 * Get all tool resource extractors — merges per-source extractors into a
 * single record keyed by tool name. Used by ChainOfThought UI to extract
 * display resource chips from tool inputs/outputs.
 */
export function getAllResourceExtractors(): Record<string, ToolResourceExtractor> {
    const result: Record<string, ToolResourceExtractor> = {};

    for (const ds of DATA_SOURCE_METAS) {
        for (const [toolName, extractor] of Object.entries(ds.resourceExtractors)) {
            if (extractor) {
                result[toolName] = extractor;
            }
        }
    }

    return result;
}

// ============================================================================
// Routing Hints
// ============================================================================

/**
 * Generate agent listing for the routing agent's system prompt.
 * Each data source contributes its agent ID and routing hint.
 */
export function buildRoutingHints(): string {
    return DATA_SOURCE_METAS.map((ds) => `- ${ds.agentId}\n  ${ds.routingHint}`).join('\n\n');
}

// ============================================================================
// Tool Name Utilities
// ============================================================================

/** Prefix a tool name with 'tool-' for matching against message part types */
export function toToolPartType(name: string): string {
    return `tool-${name}`;
}

/** Build a Set of tool-prefixed type strings from an array of tool names */
export function toToolPartTypeSet(names: readonly string[]): Set<string> {
    return new Set(names.map(toToolPartType));
}

/** Dedicated source URL generation tools */
export const SOURCE_URL_TOOL_NAMES = [
    'generateDataGovSourceUrl',
    'generateCbsSourceUrl',
    'generateNadlanSourceUrl',
    'generateDrugsSourceUrl',
    'generateHealthSourceUrl',
    'generateKnessetSourceUrl',
    'generateShufersalSourceUrl',
] as const;

/** Client-side tools (charts, suggestions) — not part of any data source */
export const CLIENT_TOOL_NAMES = [
    'displayBarChart',
    'displayLineChart',
    'displayPieChart',
    'suggestFollowUps',
] as const;

// ============================================================================
// Server-only Agent References
// ============================================================================

// NOTE: `dataSourceAgents` is NOT exported from this module.
// It lives in '@/data-sources/registry.server' to keep @mastra/core/agent
// out of the client bundle. Server-only code (mastra.ts, routing.agent.ts)
// should import it from there directly.

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { DataSourceDefinition } from './types';
export type { DataSource, AgentDisplayInfo } from './types';
