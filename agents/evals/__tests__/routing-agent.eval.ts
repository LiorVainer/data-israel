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
                data: [
                    // Flights — datastore resource e83f763b, updated daily
                    { input: 'אילו יעדים מופעלים היום משדה התעופה בן גוריון, ואילו חברות תעופה פועלות?' },
                    // Trains — datastore resource 6cf35ec2, 149K records
                    { input: 'מה אחוז הדיוק של רכבת ישראל בחודשים האחרונים, ובאילו תחנות יש הכי הרבה איחורים?' },
                    // Air quality — datastore resource a976089d, updated daily
                    { input: 'מה מצב איכות האוויר היום באזורים השונים בישראל?' },
                ],
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
                data: [
                    // CPI — CBS price index 120010
                    { input: 'איך השתנה סל יוקר המחיה בישראל בעשור האחרון, ואילו סעיפים התייקרו הכי הרבה?' },
                    // Housing prices — CBS price index 40010
                    { input: 'איך השתנה מדד מחירי הדירות בישראל בשנה האחרונה, ומה המגמה לעומת מדד המחירים לצרכן?' },
                    // Construction — CBS series subject 44
                    { input: 'מה מגמת התחלות הבנייה בישראל בשנים האחרונות, ובאילו אזורים הבנייה הכי פעילה?' },
                    // Foreign trade — CBS series subject 8
                    { input: 'מה הגירעון המסחרי של ישראל, ואילו קבוצות סחורות מובילות ביבוא וביצוא?' },
                ],
                target: routingAgent,
                scorers: [hebrewOutputScorer, noTechnicalLeakageScorer, answerRelevancyScorer, hallucinationScorer],
            });
            expect(result.scores['hebrew-output']).toBeGreaterThan(0.8);
            expect(result.scores['answer-relevancy-scorer']).toBeGreaterThan(0.7);
            expect(result.scores['hallucination-scorer']).toBeLessThan(0.3);
        },
        EVAL_TEST_TIMEOUT,
    );

    it(
        'should delegate road accident queries to CBS',
        async () => {
            const { routingAgent } = await getEvalAgents();
            const result = await runEvals({
                data: [
                    // Road accidents — CBS series subject 20 (5 subcategories)
                    { input: 'מה המגמה בתאונות דרכים עם נפגעים בישראל לפי סוג דרך וחומרת התאונה?' },
                ],
                target: routingAgent,
                scorers: [
                    hebrewOutputScorer,
                    noTechnicalLeakageScorer,
                    toolComplianceScorer,
                    answerRelevancyScorer,
                    hallucinationScorer,
                ],
            });
            expect(result.scores['hebrew-output']).toBeGreaterThan(0.8);
            expect(result.scores['answer-relevancy-scorer']).toBeGreaterThan(0.7);
            expect(result.scores['hallucination-scorer']).toBeLessThan(0.3);
        },
        EVAL_TEST_TIMEOUT,
    );
});
