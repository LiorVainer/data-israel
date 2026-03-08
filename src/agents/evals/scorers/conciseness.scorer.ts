/**
 * Conciseness Scorer
 *
 * Function-based scorer that evaluates output conciseness by counting
 * structured items (bullets, numbered items, table rows) and checking
 * for structure in long responses.
 *
 * Penalties:
 * - More than 15 items: up to -0.5 (0.05 per extra item)
 * - More than 2000 chars without structure: -0.3
 */
import { createScorer } from '@mastra/core/evals';
import { getAssistantMessageFromRunOutput } from '@mastra/evals/scorers/utils';

export const concisenessScorer = createScorer({
    type: 'agent',
    id: 'conciseness',
    description: 'Evaluate output conciseness — item limits and structure',
})
    .preprocess(({ run }) => {
        const text = getAssistantMessageFromRunOutput(run.output) ?? '';
        const bullets = (text.match(/^[\s]*[-\u2022*]\s/gm) ?? []).length;
        const numberedItems = (text.match(/^[\s]*\d+[.)]\s/gm) ?? []).length;
        const tableRows = (text.match(/\|.*\|/g) ?? []).length;
        const totalItems = bullets + numberedItems + Math.max(0, tableRows - 1); // exclude header row
        const hasStructure = /[#*|-]/.test(text);
        return { totalItems, charCount: text.length, hasStructure };
    })
    .generateScore(({ results }) => {
        const { totalItems, charCount, hasStructure } = results.preprocessStepResult;
        let score = 1;
        if (totalItems > 15) score -= Math.min(0.5, (totalItems - 15) * 0.05);
        if (charCount > 2000 && !hasStructure) score -= 0.3;
        return Math.max(0, score);
    })
    .generateReason(({ results, score }) => {
        const { totalItems, charCount } = results.preprocessStepResult;
        return `Items: ${totalItems}, Length: ${charCount} chars. Score: ${score}`;
    });
