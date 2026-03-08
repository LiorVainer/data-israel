import { describe, it, expect } from 'vitest';
import { runEvals } from '@mastra/core/evals';
import { getEvalAgents, EVAL_TEST_TIMEOUT } from './eval-helpers';
import {
    hebrewOutputScorer,
    noTechnicalLeakageScorer,
    concisenessScorer,
    sourceAttributionScorer,
    dataFreshnessScorer,
} from '../scorers';
import { answerRelevancyScorer, completenessScorer, hallucinationScorer } from '../eval.config';

describe('DataGov Agent Evals', { concurrent: true }, () => {
    it(
        'should search and summarize datasets in Hebrew',
        async () => {
            const { datagovAgent } = await getEvalAgents();
            const result = await runEvals({
                data: [{ input: 'חפש מאגרי נתונים על בתי ספר' }, { input: 'מצא מידע על תחבורה ציבורית' }],
                target: datagovAgent,
                scorers: [
                    hebrewOutputScorer,
                    noTechnicalLeakageScorer,
                    concisenessScorer,
                    sourceAttributionScorer,
                    dataFreshnessScorer,
                    answerRelevancyScorer,
                    completenessScorer,
                    hallucinationScorer,
                ],
            });
            expect(result.scores['hebrew-output']).toBe(1);
            expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.7);
            expect(result.scores['conciseness']).toBeGreaterThan(0.7);
            expect(result.scores['answer-relevancy-scorer']).toBeGreaterThan(0.7);
            expect(result.scores['hallucination-scorer']).toBeLessThan(0.3);
        },
        EVAL_TEST_TIMEOUT,
    );
});
