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
    AgentDisplayInfo,
    DataSource,
    DataSourceConfig,
    LandingConfig,
    SuggestionsConfig,
    ToolResourceExtractor,
    ToolSource,
    ToolSourceConfig,
    ToolSourceResolver,
    ToolTranslation,
} from '@/data-sources/types';
import {
    ActivityIcon,
    BarChart3Icon,
    BuildingIcon,
    CalendarIcon,
    DatabaseIcon,
    FileIcon,
    GavelIcon,
    HeartPulseIcon,
    HomeIcon,
    LandmarkIcon,
    LayersIcon,
    PillIcon,
    ScrollTextIcon,
    SearchIcon,
    ShieldCheckIcon,
    ShoppingCartIcon,
    StethoscopeIcon,
    TagIcon,
    TrendingUpIcon,
    UsersIcon,
} from 'lucide-react';

// Client-safe imports — tools, translations, display, resolvers (no Agent dependency)
import { cbsResourceExtractors, cbsSourceConfigs, CbsTools } from '@/data-sources/cbs/tools';
import { cbsTranslations } from '@/data-sources/cbs/cbs.translations';
import { cbsBadgeConfig, cbsDisplayIcon, cbsDisplayLabel } from '@/data-sources/cbs/cbs.display';

import { datagovResourceExtractors, datagovSourceResolvers, DataGovTools } from '@/data-sources/datagov/tools';
import { datagovTranslations } from '@/data-sources/datagov/datagov.translations';
import { datagovAgentDisplay, datagovBadgeConfig } from '@/data-sources/datagov/datagov.display';

import { BudgetToolNames } from '@/data-sources/budget/budget.tools';
import { budgetTranslations } from '@/data-sources/budget/budget.translations';
import { budgetBadgeConfig, budgetDisplayIcon, budgetDisplayLabel } from '@/data-sources/budget/budget.display';
import { budgetSourceResolvers } from '@/data-sources/budget/budget.source-resolvers';

import { govmapSourceConfigs, GovmapTools } from '@/data-sources/govmap/tools';
import { govmapTranslations } from '@/data-sources/govmap/govmap.translations';
import { govmapBadgeConfig, govmapDisplayIcon, govmapDisplayLabel } from '@/data-sources/govmap/govmap.display';

import { healthSourceConfigs, healthSourceResolvers, HealthTools } from '@/data-sources/health/tools';
import { healthTranslations } from '@/data-sources/health/health.translations';
import { healthBadgeConfig, healthDisplayIcon, healthDisplayLabel } from '@/data-sources/health/health.display';

import { knessetSourceConfigs, KnessetTools } from '@/data-sources/knesset/tools';
import { knessetTranslations } from '@/data-sources/knesset/knesset.translations';
import { knessetBadgeConfig, knessetDisplayIcon, knessetDisplayLabel } from '@/data-sources/knesset/knesset.display';

import { shufersalSourceConfigs, ShufersalTools } from '@/data-sources/shufersal/tools';
import { shufersalTranslations } from '@/data-sources/shufersal/shufersal.translations';
import {
    shufersalBadgeConfig,
    shufersalDisplayIcon,
    shufersalDisplayLabel,
} from '@/data-sources/shufersal/shufersal.display';

import { ramiLevySourceConfigs, RamiLevyTools } from '@/data-sources/rami-levy/tools';
import {
    ramiLevyBadgeConfig,
    ramiLevyDisplayIcon,
    ramiLevyDisplayLabel,
} from '@/data-sources/rami-levy/rami-levy.display';
import { ramiLevyTranslations } from '@/data-sources/rami-levy/rami-levy.translations';

import { clientTranslations } from '@/lib/tools/client/translations';

// ============================================================================
// Static Data Source Metadata (client-safe — no Agent imports)
// ============================================================================

interface DataSourceMeta {
    id: DataSource;
    agentId: string;
    display: { label: string; icon: typeof ActivityIcon; badge: DataSourceConfig };
    routingHint: string;
    tools: Record<string, unknown>;
    /** Declarative source URL configs — registry auto-generates resolvers */
    sourceConfigs?: Partial<Record<string, ToolSourceConfig>>;
    /** Custom source URL resolvers — override sourceConfigs for non-standard tools */
    sourceResolvers?: Partial<Record<string, ToolSourceResolver>>;
    translations: Partial<Record<string, ToolTranslation>>;
    resourceExtractors: Partial<Record<string, ToolResourceExtractor>>;
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
        sourceConfigs: cbsSourceConfigs,
        translations: cbsTranslations,
        resourceExtractors: cbsResourceExtractors,
        landing: {
            logo: '/cbs-logo.svg',
            description: 'הלשכה המרכזית לסטטיסטיקה — סדרות סטטיסטיות, מדדי מחירים ונתוני אוכלוסין',
            stats: [
                { label: 'סדרות', value: '2,000+', icon: TrendingUpIcon },
                { label: 'נושאים', value: '30+', icon: LayersIcon },
                { label: 'שנות נתונים', value: '75+', icon: CalendarIcon },
            ],
            category: 'general',
            order: 4,
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
        sourceResolvers: datagovSourceResolvers,
        translations: datagovTranslations,
        resourceExtractors: datagovResourceExtractors,
        landing: {
            logo: '/datagov-logo.svg',
            description: 'פורטל הנתונים הפתוחים של ממשלת ישראל — מאגרי מידע, ארגונים וקבצים',
            stats: [
                { label: 'מאגרי מידע', value: '1,500+', icon: DatabaseIcon },
                { label: 'ארגונים', value: '80+', icon: BuildingIcon },
                { label: 'קבצים', value: '10,000+', icon: FileIcon },
            ],
            category: 'general',
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
        sourceResolvers: budgetSourceResolvers,
        translations: budgetTranslations,
        resourceExtractors: {},
        landing: {
            logo: '/budget-logo.png',
            description: 'תקציב המדינה — הוצאות, הכנסות, התקשרויות, תמיכות ומכרזים (1997-2025)',
            stats: [
                { label: 'מאגרי נתונים', value: '8', icon: DatabaseIcon },
                { label: 'שנות תקציב', value: '28', icon: CalendarIcon },
                { label: 'שאילתות', value: 'SQL', icon: ScrollTextIcon },
            ],
            category: 'economy',
            order: 1,
        },
        suggestions: {
            prompts: [
                { label: 'תקציב משרד החינוך', prompt: 'כמה תקציב הוקצה למשרד החינוך ב-2025?', icon: LandmarkIcon },
                { label: 'התקשרויות רכש', prompt: 'אילו התקשרויות רכש ביצע משרד הביטחון?', icon: ScrollTextIcon },
            ],
        },
    },
    {
        id: 'govmap',
        agentId: 'govmapAgent',
        display: { label: govmapDisplayLabel, icon: govmapDisplayIcon, badge: govmapBadgeConfig },
        routingHint:
            'נתוני GovMap — פורטל המפות הממשלתי של ישראל. (1) נדל״ן: עסקאות לפי כתובת, מחירים למ״ר, מגמות שוק, הערכת שווי, השוואת שכונות ורחובות. (2) שירותים ציבוריים ליד כתובת: בתי חולים, תחנות משטרה, תחנות כיבוי אש, מד״א, תחנות דלק, סניפי בנקים, תחנות אוטובוס. (3) מידע קרקעי: גוש, חלקה, תת-גוש, שטח רשום, שכונה. (4) תיירות ופנאי: מלונות, צימרים, אטרקציות, יקבים, אתרי עתיקות, מתקני ספורט. (5) מידע אזורי ודמוגרפי: שכונה, אזור סטטיסטי, אוכלוסייה, מחוז, אזור טבעי, צורת ישוב. כל שאלה בנוסח "איפה יש X ליד..." או "מה השירותים באזור Y" או "ספר לי על האזור Z" שייכת לסוכן הזה.',
        tools: GovmapTools,
        sourceConfigs: govmapSourceConfigs,
        translations: govmapTranslations,
        resourceExtractors: {},
        landing: {
            logo: '/govmap-logo.png',
            description: 'GovMap — פורטל המפות הממשלתי: נדל"ן, מגמות שוק, הערכות שווי ונתוני שכונות',
            stats: [
                { label: 'כלים', value: '8', icon: HomeIcon },
                { label: 'נתוני עסקאות', value: '100K+', icon: BarChart3Icon },
                { label: 'ערים', value: '250+', icon: UsersIcon },
            ],
            category: 'general',
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
        id: 'health',
        agentId: 'healthAgent',
        display: { label: healthDisplayLabel, icon: healthDisplayIcon, badge: healthBadgeConfig },
        routingHint:
            'משרד הבריאות — מאגר תרופות (חיפוש לפי שם, סימפטום, חומר פעיל, חלופות גנריות, סל בריאות) ונתוני בריאות ציבורית (נפגעי מלחמה, שירותי רפואה, איכות חופים, מבוטחי קופות חולים, חיסוני ילדים, בדיקות התפתחותיות ואיכות שירות)',
        tools: HealthTools,
        sourceConfigs: healthSourceConfigs,
        sourceResolvers: healthSourceResolvers,
        translations: healthTranslations,
        resourceExtractors: {},
        landing: {
            logo: '/health-logo.png',
            description: 'משרד הבריאות — מאגר תרופות, חלופות גנריות, סל בריאות, קופות חולים, איכות שירות ועוד',
            stats: [
                { label: 'כלים', value: '13', icon: HeartPulseIcon },
                { label: 'תרופות + בריאות', value: '2 תחומים', icon: PillIcon },
                { label: 'מקור', value: 'משה"ב', icon: BuildingIcon },
            ],
            category: 'health',
            order: 1,
        },
        suggestions: {
            prompts: [
                { label: 'חלופות גנריות', prompt: 'מהן החלופות הגנריות לאקמול?', icon: PillIcon },
                { label: 'סל בריאות', prompt: 'אילו תרופות מכוסות בסל הבריאות לסוכרת?', icon: HeartPulseIcon },
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
        id: 'knesset',
        agentId: 'knessetAgent',
        display: { label: knessetDisplayLabel, icon: knessetDisplayIcon, badge: knessetBadgeConfig },
        routingHint: 'נתוני הכנסת — הצעות חוק, ועדות כנסת, חברי כנסת, ותהליכי חקיקה מה-API הפתוח של הכנסת',
        tools: KnessetTools,
        sourceConfigs: knessetSourceConfigs,
        translations: knessetTranslations,
        resourceExtractors: {},
        landing: {
            logo: '/knesset-logo.png',
            description: 'הכנסת — הצעות חוק, ועדות, חברי כנסת ותהליכי חקיקה',
            stats: [
                { label: 'כלים', value: '7', icon: GavelIcon },
                { label: 'כנסות', value: '25', icon: LandmarkIcon },
                { label: 'נתונים', value: 'OData', icon: DatabaseIcon },
            ],
            category: 'general',
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
        sourceConfigs: shufersalSourceConfigs,
        translations: shufersalTranslations,
        resourceExtractors: {},
        landing: {
            logo: '/shufersal-logo.png',
            description: 'שופרסל אונליין — חיפוש מוצרים, מחירים, יצרנים ומותגים ברשת הגדולה בישראל',
            stats: [
                { label: 'מוצרים', value: '30K+', icon: ShoppingCartIcon },
                { label: 'עדכון', value: 'יומי', icon: CalendarIcon },
                { label: 'כלים', value: '2', icon: TagIcon },
            ],
            category: 'economy',
            order: 2,
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
    {
        id: 'rami-levy',
        agentId: 'ramiLevyAgent',
        display: { label: ramiLevyDisplayLabel, icon: ramiLevyDisplayIcon, badge: ramiLevyBadgeConfig },
        routingHint:
            'מחירי מוצרים ברמי לוי — חיפוש מוצרים לפי שם או ברקוד, מחירים, מותגים, ומחלקות בקטלוג רמי לוי אונליין',
        tools: RamiLevyTools,
        sourceConfigs: ramiLevySourceConfigs,
        translations: ramiLevyTranslations,
        resourceExtractors: {},
        landing: {
            logo: '/rami-levy-logo.png',
            description: 'רמי לוי — חיפוש מוצרים ומחירים בקטלוג הסופרמרקט',
            stats: [
                { label: 'מוצרים', value: '30K+', icon: ShoppingCartIcon },
                { label: 'כלים', value: '2', icon: TagIcon },
            ],
            category: 'economy',
            order: 3,
        },
        suggestions: {
            prompts: [
                {
                    label: 'מחירי חלב ברמי לוי',
                    prompt: 'כמה עולה חלב תנובה 3% ברמי לוי?',
                    icon: ShoppingCartIcon,
                },
                { label: 'חיפוש מוצר ברמי לוי', prompt: 'חפש קוטג׳ 5% ברמי לוי', icon: TagIcon },
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
    ...GovmapTools,
    ...HealthTools,
    ...KnessetTools,
    ...ShufersalTools,
    ...RamiLevyTools,
} as const;

// ============================================================================
// Data Source Picker
// ============================================================================

/** All data source IDs — for UI pickers and validation */
export const ALL_DATA_SOURCE_IDS: readonly DataSource[] = DATA_SOURCE_METAS.map((ds) => ds.id);

/** Map agent ID → data source ID (e.g., 'ramiLevyAgent' → 'rami-levy') */
export const AGENT_ID_TO_SOURCE_ID: ReadonlyMap<string, DataSource> = new Map(
    DATA_SOURCE_METAS.map((ds) => [ds.agentId, ds.id]),
);

/** Data source picker metadata — lightweight subset for UI components */
export function getDataSourcePickerItems() {
    return DATA_SOURCE_METAS.filter((meta): meta is DataSourceMeta & { landing: LandingConfig } => !!meta.landing).map(
        (meta) => ({
            id: meta.id,
            label: meta.display.label,
            icon: meta.display.icon,
            logo: meta.landing.logo,
            urlLabel: meta.display.badge.urlLabel,
            category: meta.landing.category,
            categoryOrder: meta.landing.order,
        }),
    );
}

// ============================================================================
// Badge / Display Config
// ============================================================================

/** Badge configuration record keyed by data source ID */
export const DATA_SOURCE_CONFIG: Record<DataSource, DataSourceConfig> = Object.fromEntries(
    DATA_SOURCE_METAS.map((ds) => [ds.id, ds.display.badge]),
) as Record<DataSource, DataSourceConfig>;

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
const toolToDataSourceMap = new Map<string, DataSource>();
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
export function getToolDataSource(toolKey: string): DataSource | undefined {
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

import type { CommonToolInput, ToolOutputSchemaType } from '@/data-sources/types';

/** Build a type-safe resolver from a declarative ToolSourceConfig */
function buildSourceResolver(config: ToolSourceConfig): ToolSourceResolver {
    return (input: CommonToolInput, output: ToolOutputSchemaType<Record<string, never>>) => {
        if (!output.success) return [];
        const name = input.searchedResourceName;
        const label = name ? `${config.title} — ${name}` : config.title;
        const sources: ToolSource[] = [];
        if (output.portalUrl) sources.push({ url: output.portalUrl, title: label, urlType: 'portal' });
        if (output.apiUrl) sources.push({ url: output.apiUrl, title: label, urlType: 'api' });
        return sources;
    };
}

/** Pre-built map: 'tool-{toolName}' → resolver function */
const resolverMap = new Map<string, ToolSourceResolver>();
for (const ds of DATA_SOURCE_METAS) {
    // Custom resolvers take priority
    if (ds.sourceResolvers) {
        for (const [toolName, resolver] of Object.entries(ds.sourceResolvers)) {
            if (resolver) {
                resolverMap.set(`tool-${toolName}`, resolver);
            }
        }
    }
    // Declarative configs — auto-generate resolvers (skip if custom exists)
    if (ds.sourceConfigs) {
        for (const [toolName, config] of Object.entries(ds.sourceConfigs)) {
            if (config && !resolverMap.has(`tool-${toolName}`)) {
                resolverMap.set(`tool-${toolName}`, buildSourceResolver(config));
            }
        }
    }
}

/**
 * Resolve source URLs from a tool's part type, input, and output.
 * Returns an array of ToolSource (empty if no resolver or no URLs found).
 */
export function resolveToolSourceUrls(toolType: string, input: unknown, output: unknown): ToolSource[] {
    const resolver = resolverMap.get(toolType);
    if (!resolver) return [];
    return resolver(input as CommonToolInput, output as ToolOutputSchemaType<Record<string, never>>);
}

/** @deprecated Use resolveToolSourceUrls instead. Kept for backward compatibility. */
export function resolveToolSourceUrl(toolType: string, input: unknown, output: unknown): ToolSource | null {
    const sources = resolveToolSourceUrls(toolType, input, output);
    return sources[0] ?? null;
}

// ============================================================================
// Translations
// ============================================================================

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

/** All tool translations — built once, reused on every call. */
const _allTranslations: Record<string, ToolTranslation> = (() => {
    const result: Record<string, ToolTranslation> = {};

    for (const ds of DATA_SOURCE_METAS) {
        for (const [toolName, translation] of Object.entries(ds.translations)) {
            if (translation) {
                result[toolName] = translation;
            }
        }

        // Auto-generated agent-as-tool translation
        result[`agent-${ds.agentId}`] = {
            name: ds.display.label,
            icon: ds.display.icon,
            formatInput: (input: unknown) => {
                if (isRecord(input) && typeof input.prompt === 'string') return input.prompt;
                return undefined;
            },
            formatOutput: (output: unknown) => {
                if (isRecord(output) && typeof output.text === 'string') return output.text;
                return 'הושלם';
            },
        };
    }

    for (const [toolName, translation] of Object.entries(clientTranslations)) {
        if (translation) {
            result[toolName] = translation;
        }
    }

    return result;
})();

/** Get all tool translations (memoized). */
export function getAllTranslations(): Record<string, ToolTranslation> {
    return _allTranslations;
}

// ============================================================================
// Resource Extractors
// ============================================================================

/** All tool resource extractors — built once, reused on every call. */
const _allResourceExtractors: Record<string, ToolResourceExtractor> = (() => {
    const result: Record<string, ToolResourceExtractor> = {};

    for (const ds of DATA_SOURCE_METAS) {
        for (const [toolName, extractor] of Object.entries(ds.resourceExtractors)) {
            if (extractor) {
                result[toolName] = extractor;
            }
        }
    }

    return result;
})();

/** Get all tool resource extractors (memoized). */
export function getAllResourceExtractors(): Record<string, ToolResourceExtractor> {
    return _allResourceExtractors;
}

// ============================================================================
// Routing Hints
// ============================================================================

/**
 * Generate agent listing for the routing agent's system prompt.
 * Each data source contributes its agent ID and routing hint.
 *
 * @param agentIds — When provided, only include hints for these agent IDs.
 *   This ensures the routing prompt matches the actually-registered sub-agents.
 */
export function buildRoutingHints(agentIds?: string[]): string {
    const metas = agentIds ? DATA_SOURCE_METAS.filter((ds) => agentIds.includes(ds.agentId)) : DATA_SOURCE_METAS;
    return metas.map((ds) => `- ${ds.agentId}\n  ${ds.routingHint}`).join('\n\n');
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

export type { AgentDisplayInfo, DataSource } from '@/data-sources/types';
