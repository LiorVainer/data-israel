'use client';

import { useQuery } from '@tanstack/react-query';
import { OpenRouter } from '@openrouter/sdk';
import type { AvailableModel } from '@/agents/agent.config';

/** Well-known provider display names keyed by slug */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
    google: 'Google',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    meta: 'Meta',
    mistralai: 'Mistral AI',
    'x-ai': 'xAI',
    deepseek: 'DeepSeek',
    microsoft: 'Microsoft',
    amazon: 'Amazon',
    cohere: 'Cohere',
    perplexity: 'Perplexity',
    'z-ai': 'Zhipu AI',
    qwen: 'Qwen',
    nvidia: 'NVIDIA',
};

/**
 * Derives a human-readable provider name from a provider slug.
 * Checks a well-known mapping first, then falls back to capitalizing.
 */
function getProviderDisplayName(slug: string): string {
    if (PROVIDER_DISPLAY_NAMES[slug]) {
        return PROVIDER_DISPLAY_NAMES[slug];
    }
    // Capitalize first letter of each word, replacing dashes with spaces
    return slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/** Singleton SDK client (no API key required for models endpoint) */
const openRouterClient = new OpenRouter();

/**
 * Fetches all available models from OpenRouter and transforms them
 * into the `AvailableModel[]` format used by the admin panel.
 *
 * - Filters to text-capable models only (input + output modalities include "text")
 * - Sorts by provider name, then model name
 * - No static fallback: returns empty array while loading or on error
 */
async function fetchOpenRouterModels(): Promise<AvailableModel[]> {
    const response = await openRouterClient.models.list();

    if (!response.data || !Array.isArray(response.data)) {
        console.error('[useOpenRouterModels] Unexpected response shape: missing or non-array "data"');
        throw new Error('OpenRouter returned an unexpected response format');
    }

    return response.data
        .filter((model) => {
            const arch = model.architecture;
            if (!arch || !Array.isArray(arch.inputModalities) || !Array.isArray(arch.outputModalities)) {
                return false;
            }
            return arch.inputModalities.includes('text') && arch.outputModalities.includes('text');
        })
        .map((model) => {
            const slashIndex = model.id.indexOf('/');
            const providerSlug = slashIndex > 0 ? model.id.slice(0, slashIndex) : 'unknown';
            // Pricing is per-token in USD strings; convert to per-1M tokens
            const pricing = model.pricing;
            const promptRaw = pricing ? parseFloat(String(pricing.prompt)) : NaN;
            const completionRaw = pricing ? parseFloat(String(pricing.completion)) : NaN;
            return {
                id: model.id,
                name: model.name,
                provider: getProviderDisplayName(providerSlug),
                providerSlug,
                inputPrice: !isNaN(promptRaw) ? promptRaw * 1_000_000 : undefined,
                outputPrice: !isNaN(completionRaw) ? completionRaw * 1_000_000 : undefined,
            };
        })
        .sort((a, b) => {
            const providerCmp = a.provider.localeCompare(b.provider);
            if (providerCmp !== 0) return providerCmp;
            return a.name.localeCompare(b.name);
        });
}

export interface UseOpenRouterModelsResult {
    models: AvailableModel[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * React Query hook for dynamically fetching OpenRouter models.
 *
 * - `queryKey: ['openrouter-models']`
 * - `staleTime: 5 minutes`
 * - No fallback to static list; while loading, `models` is empty
 */
export function useOpenRouterModels(): UseOpenRouterModelsResult {
    const { data, isLoading, error, refetch } = useQuery<AvailableModel[], Error>({
        queryKey: ['openrouter-models'],
        staleTime: 5 * 60 * 1000,
        queryFn: fetchOpenRouterModels,
    });

    return {
        models: data ?? [],
        isLoading,
        error: error ?? null,
        refetch,
    };
}
