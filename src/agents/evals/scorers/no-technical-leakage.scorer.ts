/**
 * No Technical Leakage Scorer
 *
 * Function-based scorer that detects technical implementation details
 * that should be hidden from end users: UUIDs, JSON objects, API URLs,
 * internal tool names, and CKAN field names.
 *
 * Score = max(0, 1 - detected_patterns / total_patterns)
 */
import { createScorer } from '@mastra/core/evals';
import { getAssistantMessageFromRunOutput } from '@mastra/evals/scorers/utils';

const LEAKAGE_PATTERNS = [
    { name: 'UUID', pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i },
    { name: 'JSON object', pattern: /\{[\s]*"[a-zA-Z_]+"\s*:/ },
    { name: 'data.gov.il API URL', pattern: /data\.gov\.il\/api\// },
    { name: 'CBS API URL', pattern: /apis\.cbs\.gov\.il\// },
    {
        name: 'Tool name',
        pattern:
            /\b(searchDatasets|queryDatastoreResource|getDatasetDetails|getResourceDetails|browseCbsCatalog|getCbsSeriesData|browseCbsPriceIndices|generateDataGovSourceUrl|generateCbsSourceUrl|suggestFollowUps)\b/,
    },
    {
        name: 'CKAN field',
        pattern: /\b(resource_id|package_id|metadata_modified|num_resources|datastore_active)\b/,
    },
] as const;

export const noTechnicalLeakageScorer = createScorer({
    type: 'agent',
    id: 'no-tech-leakage',
    description: 'Detect technical details that should be hidden from users',
})
    .preprocess(({ run }) => {
        const text = getAssistantMessageFromRunOutput(run.output) ?? '';
        const detected = LEAKAGE_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ name }) => name);
        return { detected, total: LEAKAGE_PATTERNS.length };
    })
    .generateScore(({ results }) => {
        const { detected, total } = results.preprocessStepResult;
        return Math.max(0, 1 - detected.length / total);
    })
    .generateReason(({ results, score }) => {
        const { detected } = results.preprocessStepResult;
        if (detected.length === 0) return `No technical leakage detected. Score: ${score}`;
        return `Detected: ${detected.join(', ')}. Score: ${score}`;
    });
