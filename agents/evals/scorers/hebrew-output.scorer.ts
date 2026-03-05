/**
 * Hebrew Output Scorer
 *
 * Function-based scorer that measures the ratio of Hebrew characters
 * to total alphabetic characters in the agent's response.
 *
 * Scoring:
 * - ratio > 0.7 => score 1
 * - ratio < 0.3 => score 0
 * - otherwise => linear interpolation between 0.3 and 0.7
 */
import { createScorer } from '@mastra/core/evals';
import { getAssistantMessageFromRunOutput } from '@mastra/evals/scorers/utils';

export const hebrewOutputScorer = createScorer({
    type: 'agent',
    id: 'hebrew-output',
    description: 'Verify agent output is in Hebrew',
})
    .preprocess(({ run }) => {
        const text = getAssistantMessageFromRunOutput(run.output) ?? '';
        const hebrewChars = (text.match(/[\u0590-\u05FF]/g) ?? []).length;
        const totalAlpha = (text.match(/[a-zA-Z\u0590-\u05FF]/g) ?? []).length;
        return {
            hebrewRatio: totalAlpha > 0 ? hebrewChars / totalAlpha : 1,
            hebrewChars,
            totalAlpha,
        };
    })
    .generateScore(({ results }) => {
        const ratio = results.preprocessStepResult.hebrewRatio;
        if (ratio > 0.7) return 1;
        if (ratio < 0.3) return 0;
        return (ratio - 0.3) / 0.4;
    })
    .generateReason(
        ({ results, score }) =>
            `Hebrew ratio: ${(results.preprocessStepResult.hebrewRatio * 100).toFixed(1)}%. Score: ${score}`,
    );
