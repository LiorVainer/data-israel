/** Available model definition */
export interface AvailableModel {
    id: string;
    name: string;
    provider: string;
    providerSlug: string;
    /** USD per 1M input tokens (optional — only available from OpenRouter API) */
    inputPrice?: number;
    /** USD per 1M output tokens (optional — only available from OpenRouter API) */
    outputPrice?: number;
}

import { ENV } from '@/lib/env';

/**
 * OpenRouter provider routing options.
 * Forces all requests through Google AI Studio (not Vertex AI)
 * to use the BYOK API key configured in OpenRouter.
 *
 * Provider slug reference: https://openrouter.ai/docs/guides/routing/provider-selection
 * - "google-ai-studio" = Google AI Studio (uses BYOK Gemini API key)
 * - "google-vertex" = Google Vertex AI (separate billing)
 */
export const OPENROUTER_PROVIDER_OPTIONS = {
    openrouter: {
        provider: {
            only: ['google-ai-studio'] as string[],
        },
    },
};

export const AgentConfig = {
    /** Model configuration */
    MODEL: {
        /** Default OpenRouter model ID (configurable via AI_DEFAULT_MODEL_ID env var) */
        DEFAULT_ID: ENV.AI_DEFAULT_MODEL_ID,
        /** DataGov agent model ID (falls back to DEFAULT_ID) */
        DATAGOV_ID: ENV.AI_DATAGOV_MODEL_ID ?? ENV.AI_DEFAULT_MODEL_ID,
        /** CBS agent model ID (falls back to DEFAULT_ID) */
        CBS_ID: ENV.AI_CBS_MODEL_ID ?? ENV.AI_DEFAULT_MODEL_ID,
        /** Budget agent model ID (falls back to DEFAULT_ID) */
        BUDGET_ID: ENV.AI_BUDGET_MODEL_ID ?? ENV.AI_DEFAULT_MODEL_ID,
        /** Nadlan agent model ID (falls back to DEFAULT_ID) */
        NADLAN_ID: ENV.AI_NADLAN_MODEL_ID ?? ENV.AI_DEFAULT_MODEL_ID,
        /** Drugs agent model ID (falls back to DEFAULT_ID) */
        DRUGS_ID: ENV.AI_DRUGS_MODEL_ID ?? ENV.AI_DEFAULT_MODEL_ID,
        /** Health agent model ID (falls back to DEFAULT_ID) */
        HEALTH_ID: ENV.AI_HEALTH_MODEL_ID ?? ENV.AI_DEFAULT_MODEL_ID,
        /** Grocery agent model ID (falls back to DEFAULT_ID) */
        GROCERY_ID: ENV.AI_GROCERY_MODEL_ID ?? ENV.AI_DEFAULT_MODEL_ID,
        /** Knesset agent model ID (falls back to DEFAULT_ID) */
        KNESSET_ID: ENV.AI_KNESSET_MODEL_ID ?? ENV.AI_DEFAULT_MODEL_ID,
    },

    /** Memory configuration for all agents */
    MEMORY: {
        /** Number of recent messages from current thread included in each request */
        LAST_MESSAGES: 20,
        /** Whether to auto-generate thread titles */
        GENERATE_TITLE: true,
        /** Semantic recall (cross-conversation RAG) settings for the routing agent */
        SEMANTIC_RECALL: {
            /** Number of semantically similar messages to retrieve */
            TOP_K: 5,
            /** Messages before/after each match to include as context */
            MESSAGE_RANGE: 3,
        },
        /** Embedder model for semantic recall */
        EMBEDDER_MODEL: 'openai/text-embedding-3-small',
    },

    /** Chat API route configuration */
    CHAT: {
        /** Max agent loop steps before forced stop */
        MAX_STEPS: ENV.AI_MAX_STEPS,
        /** Max request duration in seconds */
        MAX_DURATION: 120,
        /** Number of tool calls to run in parallel */
        TOOL_CALL_CONCURRENCY: ENV.AI_TOOL_CALL_CONCURRENCY,
        /** Tool name that must be called before the agent stops */
        SUGGEST_TOOL_NAME: 'suggestFollowUps',
        /** Default resource ID for unauthenticated users */
        DEFAULT_RESOURCE_ID: 'default-user',
        /** Header name for passing user ID from client */
        USER_ID_HEADER: 'x-user-id',
        /** Maximum context window tokens for the model */
        MAX_CONTEXT_TOKENS: 200_000,
    },

    /** Available models for selection */
    AVAILABLE_MODELS: [
        {
            id: 'x-ai/grok-4.1-fast',
            name: 'Grok 4.1 Fast',
            provider: 'xAI',
            providerSlug: 'xai',
            inputPrice: 0.2,
            outputPrice: 0.5,
        },
        {
            id: 'google/gemini-3-flash-preview',
            name: 'Gemini 3 Flash Preview',
            provider: 'Google',
            providerSlug: 'google',
            inputPrice: 0.5,
            outputPrice: 3.0,
        },
        {
            id: 'z-ai/glm-4.7-flash',
            name: 'GLM 4.7 Flash',
            provider: 'Zhipu AI',
            providerSlug: 'zhipuai',
            inputPrice: 0.06,
            outputPrice: 0.4,
        },
    ] satisfies AvailableModel[],

    /** Display limits */
    DISPLAY: {
        /** Max datasets to check in detail */
        MAX_DATASETS_TO_CHECK: 7,
        /** Default rows to show in results */
        DEFAULT_ROWS_DISPLAY: 10,
        /** Max rows to show in results */
        MAX_ROWS_DISPLAY: 20,
    },
} as const;
