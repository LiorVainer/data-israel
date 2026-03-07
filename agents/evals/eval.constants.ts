/**
 * Eval Constants
 *
 * Pure config values with no scorer imports — prevents circular dependencies.
 */

export const EVAL_CONFIG = {
    /** Cheap LLM judge for prompt-object scorer steps */
    JUDGE_MODEL: 'openrouter/openai/gpt-oss-120b:free',
    /** Default sampling rate for non-critical live scorers */
    LIVE_SAMPLING_RATE: 0.3,
    /** Sampling rate for critical scorers (e.g., Hebrew output) */
    CRITICAL_SAMPLING_RATE: 1.0,
    /** Scores below this trigger prompt optimization */
    SCORE_THRESHOLD: 0.7,
    /** Strong model for meta-prompt optimization */
    OPTIMIZER_MODEL: 'openrouter/openai/gpt-oss-120b:free',
} as const;
