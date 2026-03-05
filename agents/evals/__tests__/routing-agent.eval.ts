import { describe, it, expect } from 'vitest';
import { runEvals } from '@mastra/core/evals';
import { getEvalAgents, EVAL_TEST_TIMEOUT } from './eval-helpers';
import { hebrewOutputScorer, noTechnicalLeakageScorer, toolComplianceScorer, dataFreshnessScorer } from '../scorers';
import { answerRelevancyScorer, completenessScorer, hallucinationScorer } from '../eval.config';

describe('Routing Agent Evals', { concurrent: true }, () => {
    it(
        'should delegate data.gov.il queries correctly',
        async () => {
            const { routingAgent } = await getEvalAgents();
            const result = await runEvals({
                data: [{ input: 'חפש מאגרי נתונים על חינוך' }, { input: 'כמה מאגרי מידע יש על תחבורה?' }],
                target: routingAgent,
                scorers: [
                    hebrewOutputScorer,
                    noTechnicalLeakageScorer,
                    toolComplianceScorer,
                    dataFreshnessScorer,
                    answerRelevancyScorer,
                    completenessScorer,
                    hallucinationScorer,
                ],
            });
            expect(result.scores['hebrew-output']).toBeGreaterThan(0.8);
            expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.7);
            expect(result.scores['answer-relevancy-scorer']).toBeGreaterThan(0.7);
            expect(result.scores['hallucination-scorer']).toBeLessThan(0.3);
        },
        EVAL_TEST_TIMEOUT,
    );

    it(
        'should delegate CBS queries correctly',
        async () => {
            const { routingAgent } = await getEvalAgents();
            const result = await runEvals({
                data: [{ input: 'מה מדד המחירים לצרכן?' }, { input: 'מהי האוכלוסייה של תל אביב?' }],
                target: routingAgent,
                scorers: [hebrewOutputScorer, noTechnicalLeakageScorer, answerRelevancyScorer, hallucinationScorer],
            });
            expect(result.scores['hebrew-output']).toBeGreaterThan(0.8);
            expect(result.scores['answer-relevancy-scorer']).toBeGreaterThan(0.7);
            expect(result.scores['hallucination-scorer']).toBeLessThan(0.3);
        },
        EVAL_TEST_TIMEOUT,
    );
});
