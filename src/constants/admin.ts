import type { AvailableModel } from '@/agents/agent.config';
import { AgentsDisplayMap } from '@/data-sources/registry';
import type { LucideIcon } from 'lucide-react';

/** A single agent config entry for the admin panel */
export interface AgentConfig {
    id: string;
    label: string;
    dialogTitle: string;
    icon: LucideIcon;
}

/** Agent ID type — dynamic, derived from registry */
export type AgentId = string;

/** Routing agent config (always first in the admin panel) */
export const ROUTING_AGENT_CONFIG: AgentConfig = {
    id: 'routing',
    label: AgentsDisplayMap.routingAgent.label,
    dialogTitle: 'Routing Agent',
    icon: AgentsDisplayMap.routingAgent.icon,
};

/** Sub-agent configs — derived from registry entries that have a dataSource */
export const SUB_AGENT_CONFIGS: readonly AgentConfig[] = Object.entries(AgentsDisplayMap)
    .filter(([key, info]) => key !== 'routingAgent' && info.dataSource)
    .map(([key, info]) => ({
        id: key,
        label: info.label,
        dialogTitle: `${info.label} Agent`,
        icon: info.icon,
    }));

/** All agent configs — routing first, then sub-agents */
export const ALL_AGENT_CONFIGS: readonly AgentConfig[] = [ROUTING_AGENT_CONFIG, ...SUB_AGENT_CONFIGS];

/**
 * @deprecated Use ALL_AGENT_CONFIGS, ROUTING_AGENT_CONFIG, or SUB_AGENT_CONFIGS instead.
 * Kept for backward compatibility during transition.
 */
export const AGENT_CONFIGS = ALL_AGENT_CONFIGS;

/** Client-safe default model ID (first model in the static config) */
export const CLIENT_DEFAULT_MODEL = 'google/gemini-3-flash-preview';

/** Format a price value for display */
export function formatPrice(price: number | undefined): string {
    if (price === undefined) return '-';
    if (price === 0) return 'Free';
    if (price < 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
}

/**
 * Derives display information for any model ID.
 * If the model exists in the fetched list, uses that data.
 * Otherwise, derives display info from the model ID itself.
 */
export function getModelDisplay(modelId: string, models: AvailableModel[]): AvailableModel {
    const found = models.find((m) => m.id === modelId);
    if (found) return found;

    const slashIndex = modelId.indexOf('/');
    const providerSlug = slashIndex > 0 ? modelId.slice(0, slashIndex) : modelId;
    const rawName = slashIndex > 0 ? modelId.slice(slashIndex + 1) : modelId;
    const displayName = rawName
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return {
        id: modelId,
        name: displayName,
        provider: providerSlug.charAt(0).toUpperCase() + providerSlug.slice(1),
        providerSlug,
    };
}
