import { describe, it, expect } from 'vitest';
import { runEvals } from '@mastra/core/evals';
import { getEvalAgents, EVAL_TEST_TIMEOUT } from './eval-helpers';
import { hebrewOutputScorer, noTechnicalLeakageScorer, concisenessScorer, dataFreshnessScorer } from '../scorers';
import { answerRelevancyScorer, completenessScorer, hallucinationScorer } from '../eval.config';

describe('CBS Agent Evals', { concurrent: true }, () => {
    it(
        'should return statistical data in Hebrew',
        async () => {
            const { cbsAgent } = await getEvalAgents();
            const result = await runEvals({
                data: [{ input: 'מה מדד המחירים לצרכן?' }, { input: 'חפש נתוני אוכלוסייה של חיפה' }],
                target: cbsAgent,
                scorers: [
                    hebrewOutputScorer,
                    noTechnicalLeakageScorer,
                    concisenessScorer,
                    dataFreshnessScorer,
                    answerRelevancyScorer,
                    completenessScorer,
                    hallucinationScorer,
                ],
            });
            expect(result.scores['hebrew-output']).toBe(1);
            expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.7);
            expect(result.scores['answer-relevancy-scorer']).toBeGreaterThan(0.7);
            expect(result.scores['hallucination-scorer']).toBeLessThan(0.3);
        },
        EVAL_TEST_TIMEOUT,
    );
});
