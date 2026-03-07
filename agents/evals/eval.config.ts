/**
 * Eval Configuration
 *
 * Scorer instances, shared agent scorer map, and Mastra-level scorer registry.
 * Pure config values live in eval.constants.ts to avoid circular deps.
 */

import {
    createAnswerRelevancyScorer,
    createCompletenessScorer,
    createHallucinationScorer,
} from '@mastra/evals/scorers/prebuilt';
import { extractToolResults } from '@mastra/evals/scorers/utils';
import type { MastraScorer } from '@mastra/core/evals';
import {
    hebrewOutputScorer,
    noTechnicalLeakageScorer,
    toolComplianceScorer,
    concisenessScorer,
    sourceAttributionScorer,
    dataFreshnessScorer,
} from './scorers';
import { EVAL_CONFIG } from './eval.constants';

// Re-export for consumers that import EVAL_CONFIG from here
export { EVAL_CONFIG } from './eval.constants';

// ── Built-in Mastra scorers ───────────────────────────────────────────

/** Answer relevancy — does the response actually address the user's question? */
export const answerRelevancyScorer = createAnswerRelevancyScorer({
    model: EVAL_CONFIG.JUDGE_MODEL,
});

/** Completeness — does the output cover key elements from the input? (function-based, no LLM cost) */
export const completenessScorer = createCompletenessScorer();

/** Hallucination — does the response contradict data returned by tools? Uses dynamic context from tool results. */
export const hallucinationScorer = createHallucinationScorer({
    model: EVAL_CONFIG.JUDGE_MODEL,
    options: {
        getContext: ({ run }) => {
            const toolResults = extractToolResults(run.output);
            return toolResults.map((t) => JSON.stringify({ tool: t.toolName, result: t.result }));
        },
    },
});

// ── Shared agent scorer config ────────────────────────────────────────

type ScorerSampling = { type: 'ratio'; rate: number };
type ScorerEntry = { scorer: MastraScorer; sampling: ScorerSampling };

const live = (scorer: MastraScorer): ScorerEntry => ({
    scorer,
    sampling: { type: 'ratio' as const, rate: EVAL_CONFIG.LIVE_SAMPLING_RATE },
});

const critical = (scorer: MastraScorer): ScorerEntry => ({
    scorer,
    sampling: { type: 'ratio' as const, rate: EVAL_CONFIG.CRITICAL_SAMPLING_RATE },
});

import { ENV } from '@/lib/env';

/** Whether runtime scorers are enabled (set AI_ENABLE_SCORERS=true to enable) */
const SCORERS_ENABLED = ENV.AI_ENABLE_SCORERS;

/**
 * Shared scorer config for all agents (with sampling rates).
 * Imported by routing, datagov, and cbs agent factories.
 * Disabled by default — set AI_ENABLE_SCORERS=true to enable.
 */
export const AGENT_SCORERS = SCORERS_ENABLED
    ? {
          // Custom scorers
          hebrewOutput: live(hebrewOutputScorer),
          noTechLeakage: live(noTechnicalLeakageScorer),
          toolCompliance: critical(toolComplianceScorer),
          conciseness: live(concisenessScorer),
          sourceAttribution: critical(sourceAttributionScorer),
          dataFreshness: critical(dataFreshnessScorer),
          // Built-in Mastra scorers
          answerRelevancy: live(answerRelevancyScorer),
          completeness: live(completenessScorer),
          hallucination: critical(hallucinationScorer),
      }
    : undefined;

/**
 * Flat scorer map for Mastra instance registration.
 * Mastra({ scorers }) takes { name: scorer } without sampling config.
 * Disabled by default — set AI_ENABLE_SCORERS=true to enable.
 */
export const MASTRA_SCORERS = SCORERS_ENABLED
    ? {
          hebrewOutput: hebrewOutputScorer,
          noTechLeakage: noTechnicalLeakageScorer,
          toolCompliance: toolComplianceScorer,
          conciseness: concisenessScorer,
          sourceAttribution: sourceAttributionScorer,
          dataFreshness: dataFreshnessScorer,
          answerRelevancy: answerRelevancyScorer,
          completeness: completenessScorer,
          hallucination: hallucinationScorer,
      }
    : undefined;
