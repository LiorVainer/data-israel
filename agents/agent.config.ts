/** Available model definition */
export interface AvailableModel {
    id: string;
    name: string;
    provider: string;
    providerSlug: string;
}

export const AgentConfig = {
    /** Model configuration */
    MODEL: {
        /** Default OpenRouter model ID (configurable via DEFAULT_MODEL_ID env var) */
        DEFAULT_ID: process.env.DEFAULT_MODEL_ID ?? 'google/gemini-3-flash-preview',
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
        MAX_STEPS: 10,
        /** Max request duration in seconds */
        MAX_DURATION: 120,
        /** Number of tool calls to run in parallel */
        TOOL_CALL_CONCURRENCY: 10,
        /** Tool name that must be called before the agent stops */
        SUGGEST_TOOL_NAME: 'suggestFollowUps',
        /** Default resource ID for unauthenticated users */
        DEFAULT_RESOURCE_ID: 'default-user',
        /** Header name for passing user ID from client */
        USER_ID_HEADER: 'x-user-id',
    },

    /** Available models for selection */
    AVAILABLE_MODELS: [
        {
            id: 'google/gemini-3-flash-preview',
            name: 'Gemini 3 Flash Preview',
            provider: 'Google',
            providerSlug: 'google',
        },
        {
            id: 'x-ai/grok-4.1-fast',
            name: 'Grok 4.1 Fast',
            provider: 'xAI',
            providerSlug: 'xai',
        },
        {
            id: 'z-ai/glm-4.7-flash',
            name: 'GLM 4.7 Flash',
            provider: 'Zhipu AI',
            providerSlug: 'zhipuai',
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
