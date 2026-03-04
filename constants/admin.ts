import type { AvailableModel } from '@/agents/agent.config';
import { AgentsDisplayMap } from './agents-display';

/** Agent configuration for the admin panel */
export const AGENT_CONFIGS = [
    { id: 'routing', label: 'סוכן ניתוב', dialogTitle: 'Routing Agent', icon: AgentsDisplayMap.routingAgent.icon },
    {
        id: 'datagov',
        label: 'סוכן data.gov.il',
        dialogTitle: 'DataGov Agent',
        icon: AgentsDisplayMap.datagovAgent.icon,
    },
    { id: 'cbs', label: 'סוכן הלמ"ס', dialogTitle: 'CBS Agent', icon: AgentsDisplayMap.cbsAgent.icon },
] as const;

export type AgentId = (typeof AGENT_CONFIGS)[number]['id'];

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
