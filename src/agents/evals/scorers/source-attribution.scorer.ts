/**
 * Source Attribution Scorer
 *
 * Function-based scorer that checks for source URL references and
 * attribution markers when data is presented in the response.
 *
 * If no substantial data is presented (no numbers + short response),
 * attribution is not required and the score is 1.
 * Otherwise, at least 2 source indicators are needed for full score.
 */
import { createScorer } from '@mastra/core/evals';
import { getAssistantMessageFromRunOutput } from '@mastra/evals/scorers/utils';

const SOURCE_PATTERNS = [
    /https?:\/\/data\.gov\.il/, // data.gov.il links
    /https?:\/\/[^\s]+cbs\.gov\.il/, // CBS links
    /\u05DE\u05E7\u05D5\u05E8[:\s]/, // Hebrew "מקור:"
    /\u05E2\u05D5\u05D3\u05DB\u05DF \u05DC\u05D0\u05D7\u05E8\u05D5\u05E0\u05D4/, // Hebrew "עודכן לאחרונה"
    /\[.*\]\(https?:\/\/[^\s)]+\)/, // markdown links
] as const;

export const sourceAttributionScorer = createScorer({
    type: 'agent',
    id: 'source-attribution',
    description: 'Check for source URL references when data is presented',
})
    .preprocess(({ run }) => {
        const text = getAssistantMessageFromRunOutput(run.output) ?? '';
        const hasData = /\d{2,}/.test(text) && text.length > 200; // numbers + substantial content = data
        const sourcesFound = SOURCE_PATTERNS.filter((p) => p.test(text)).length;
        return { hasData, sourcesFound, totalPatterns: SOURCE_PATTERNS.length };
    })
    .generateScore(({ results }) => {
        const { hasData, sourcesFound } = results.preprocessStepResult;
        if (!hasData) return 1; // no data presented => not applicable
        return Math.min(1, sourcesFound / 2); // need at least 2 source indicators for full score
    })
    .generateReason(({ results, score }) => {
        const { hasData, sourcesFound } = results.preprocessStepResult;
        if (!hasData) return `No data presented — attribution not required. Score: ${score}`;
        return `Source indicators found: ${sourcesFound}. Score: ${score}`;
    });
