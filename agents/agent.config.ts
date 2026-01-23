export const AgentConfig = {
  /** Tool calls configuration */
  toolCalls: {
    /** Minimum steps before stopping is allowed */
    MIN_STEPS_BEFORE_STOP: 0,
    /** Hard limit on maximum steps */
    MAX_STEPS: 10,
  },

  /** Model configuration */
  model: {
    /** OpenRouter model ID */
    ID: 'z-ai/glm-4.7-flash',
    /** Tool choice strategy */
    TOOL_CHOICE: 'required' as const,
  },

  /** Completion detection markers (Hebrew) */
  completionMarkers: [
    'סיכום:',
    'מצאתי את כל הנתונים',
    'לא מצאתי נתונים',
    'סיימתי לחפש',
    'סיימתי את החיפוש',
  ],

  /** Display limits */
  display: {
    /** Max datasets to check in detail */
    MAX_DATASETS_TO_CHECK: 7,
    /** Default rows to show in results */
    DEFAULT_ROWS_DISPLAY: 10,
    /** Max rows to show in results */
    MAX_ROWS_DISPLAY: 20,
  },
};