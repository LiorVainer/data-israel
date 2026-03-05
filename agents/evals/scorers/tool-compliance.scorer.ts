/**
 * Tool Compliance Scorer
 *
 * LLM-based scorer that evaluates whether the agent's output demonstrates
 * correct tool usage patterns: follow-up suggestions, source references,
 * and data-backed content.
 *
 * Penalties:
 * - Missing follow-up suggestions: -0.3
 * - Missing source references: -0.3
 * - Data appears unsupported/hallucinated: -0.4
 */
import { createScorer } from '@mastra/core/evals';
import { getAssistantMessageFromRunOutput } from '@mastra/evals/scorers/utils';
import { z } from 'zod';

import { EVAL_CONFIG } from '../eval.constants';

export const toolComplianceScorer = createScorer({
    type: 'agent',
    id: 'tool-compliance',
    description: 'Evaluate whether agent output demonstrates correct tool usage patterns',
    judge: {
        model: EVAL_CONFIG.JUDGE_MODEL,
        instructions: 'You evaluate AI agent outputs for evidence of proper data retrieval tool usage.',
    },
})
    .analyze({
        description: 'Check for evidence of proper tool usage in agent output',
        outputSchema: z.object({
            hasFollowUpSuggestions: z.boolean(),
            hasSourceReferences: z.boolean(),
            appearsDataBacked: z.boolean(),
            issues: z.array(z.string()),
        }),
        createPrompt: ({ run }) => {
            const text = getAssistantMessageFromRunOutput(run.output) ?? '';
            return `Analyze this Hebrew AI agent response for tool usage compliance:

"${text.slice(0, 3000)}"

Check:
1. Does it include follow-up suggestions for the user?
2. Does it reference data sources (URLs, links, attribution)?
3. Does it present data that appears retrieved from tools (not hallucinated)?
4. List any compliance issues found.

Return JSON: { hasFollowUpSuggestions, hasSourceReferences, appearsDataBacked, issues }`;
        },
    })
    .generateScore(({ results }) => {
        const r = results.analyzeStepResult;
        let score = 1;
        if (!r.hasFollowUpSuggestions) score -= 0.3;
        if (!r.hasSourceReferences) score -= 0.3;
        if (!r.appearsDataBacked) score -= 0.4;
        return Math.max(0, score);
    })
    .generateReason(({ results, score }) => {
        const r = results.analyzeStepResult;
        const parts: string[] = [];
        if (!r.hasFollowUpSuggestions) parts.push('Missing follow-up suggestions');
        if (!r.hasSourceReferences) parts.push('Missing source references');
        if (!r.appearsDataBacked) parts.push('Data appears unsupported');
        if (r.issues.length) parts.push(...r.issues);
        return parts.length ? `Issues: ${parts.join('; ')}. Score: ${score}` : `All checks passed. Score: ${score}`;
    });
