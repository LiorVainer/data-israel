/**
 * Data Source Definition
 *
 * Core interface that every data source module must satisfy.
 * Generic over TTools for type-safe key checking on sourceResolvers and translations.
 */

import type { Agent } from '@mastra/core/agent';
import type { Tool } from '@mastra/core/tools';
import type { LucideIcon } from 'lucide-react';
import type { ToolResourceExtractor, ToolSourceResolver, ToolTranslation } from './tool.types';
import type { DataSourceConfig, LandingConfig } from './display.types';

export interface DataSourceDefinition<TTools extends Record<string, Tool<any, any, any, any, any, any, any>>> {
    /** Unique key — 'cbs' | 'datagov' | future sources */
    id: string;

    /** Agent configuration */
    agent: {
        /** Agent ID used in Mastra registration (e.g., 'cbsAgent') */
        id: string;
        /** Hebrew display name */
        name: string;
        /** English description for Mastra agent routing */
        description: string;
        /** System prompt / instructions */
        instructions: string;
        /** Factory function to create agent with a specific model (may be async for MCP-based sources) */
        createAgent: (modelId: string) => Agent | Promise<Agent>;
    };

    /** UI display metadata */
    display: {
        /** Hebrew label shown in ChainOfThought UI */
        label: string;
        /** Icon component for agent display */
        icon: LucideIcon;
        /** Badge configuration for data source attribution */
        badge: DataSourceConfig;
    };

    /**
     * Routing hint — Hebrew description of when to delegate to this agent.
     * Auto-injected into routing agent's system prompt by the registry.
     */
    routingHint: string;

    /** All Mastra tools for this data source */
    tools: TTools;

    /** Per-tool source URL resolvers (keys must be tool names from TTools) */
    sourceResolvers: Partial<Record<keyof TTools & string, ToolSourceResolver>>;

    /** Per-tool Hebrew translations (keys must be tool names from TTools) */
    translations: Partial<Record<keyof TTools & string, ToolTranslation>>;

    /** Per-tool resource extractors for ChainOfThought UI chips */
    resourceExtractors?: Partial<Record<keyof TTools & string, ToolResourceExtractor>>;

    /** Optional landing page display config */
    landing?: LandingConfig;
}
