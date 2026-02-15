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
        /** Tool choice strategy */
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
