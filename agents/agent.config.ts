/** Available model definition */
export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  providerSlug: string;
}

export const AgentConfig = {
  /** Tool calls configuration */
  TOOL_CALLS: {
    /** Minimum steps before stopping is allowed */
    MIN_STEPS_BEFORE_STOP: 0,
    /** Hard limit on maximum steps */
    MAX_STEPS: 25,
  },

  /** Model configuration */
  MODEL: {
    /** Default OpenRouter model ID */
    DEFAULT_ID: 'x-ai/grok-4.1-fast',
    /** Tool choice strategy */
  },

  /** Available models for selection */
  AVAILABLE_MODELS: [
    {
      id: 'x-ai/grok-4.1-fast',
      name: 'Grok 4.1 Fast',
      provider: 'xAI',
      providerSlug: 'xai',
    },
    {
      id: 'google/gemini-3-flash-preview',
      name: 'Gemini 3 Flash Preview',
      provider: 'Google',
      providerSlug: 'google',
    },
    {
      id: 'z-ai/glm-4.7-flash',
      name: 'GLM 4.7 Flash',
      provider: 'Zhipu AI',
      providerSlug: 'zhipuai',
    },
  ] satisfies AvailableModel[],

  /** Completion detection markers (Hebrew) */
  COMPLETION_MARKERS: [
    'סיכום:',
    'מצאתי את כל הנתונים',
    'לא מצאתי נתונים',
    'סיימתי לחפש',
    'סיימתי את החיפוש',
  ],

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
