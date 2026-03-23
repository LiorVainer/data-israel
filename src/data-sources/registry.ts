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

import type { ToolTranslation, ToolSourceResolver, DataSourceConfig, AgentDisplayInfo, DataSource } from './types';
import { ActivityIcon } from 'lucide-react';

// Client-safe imports — tools, translations, display, resolvers (no Agent dependency)
import { CbsTools, cbsSourceResolvers } from './cbs/tools';
import { cbsTranslations } from './cbs/cbs.translations';
import { cbsDisplayLabel, cbsDisplayIcon, cbsBadgeConfig } from './cbs/cbs.display';

import { DataGovTools, datagovSourceResolvers } from './datagov/tools';
import { datagovTranslations } from './datagov/datagov.translations';
import { datagovAgentDisplay, datagovBadgeConfig } from './datagov/datagov.display';

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
    },
] as const;

// ============================================================================
// Merged Tools
// ============================================================================

/** All tools from all data sources — used for type derivation in agents/types.ts */
export const allDataSourceTools = {
    ...CbsTools,
    ...DataGovTools,
} as const;

// ============================================================================
// Badge / Display Config
// ============================================================================

/** Badge configuration record keyed by data source ID */
export const DATA_SOURCE_CONFIG: Record<DataSourceId, DataSourceConfig> = Object.fromEntries(
    DATA_SOURCE_METAS.map((ds) => [ds.id, ds.display.badge]),
) as Record<DataSourceId, DataSourceConfig>;

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
export function resolveToolSourceUrl(toolType: string, input: unknown, output: unknown): ReturnType<ToolSourceResolver> {
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
