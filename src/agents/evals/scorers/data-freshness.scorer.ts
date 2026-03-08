/**
 * Data Freshness Scorer
 *
 * LLM-based scorer that cross-references dates in tool results against
 * dates mentioned in the agent's text response.
 *
 * Catches cases where the agent reports stale dates (e.g., "data from 2023")
 * when tool results actually show current data (e.g., lastUpdated: 2026).
 *
 * Pipeline:
 * 1. preprocess: extract date fields from tool invocations + text from assistant messages
 * 2. analyze (LLM judge): compare tool dates vs text dates
 * 3. generateScore: penalize per discrepancy
 * 4. generateReason: explain findings
 */
import { createScorer } from '@mastra/core/evals';
import { extractAgentResponseMessages, extractToolResults } from '@mastra/evals/scorers/utils';
import type { ScorerRunOutputForAgent } from '@mastra/core/evals';
import { z } from 'zod';

import { EVAL_CONFIG } from '../eval.constants';

/** Known date fields in tool results to extract */
const DATE_FIELDS = [
    'lastUpdated',
    'lastUpdate',
    'last_modified',
    'lastModified',
    'metadata_modified',
    'metadata_created',
] as const;

const PERIOD_FIELDS = ['period', 'year', 'month', 'endPeriod', 'startPeriod'] as const;

interface ExtractedDate {
    tool: string;
    field: string;
    value: string;
}

/** Extract date values from tool result objects recursively */
function extractDatesFromObject(
    obj: Record<string, unknown>,
    toolName: string,
    dates: ExtractedDate[],
    depth = 0,
): void {
    if (depth > 4) return;

    for (const [key, value] of Object.entries(obj)) {
        if ((DATE_FIELDS as readonly string[]).includes(key) && typeof value === 'string' && value.length > 0) {
            dates.push({ tool: toolName, field: key, value });
        }
        if (
            (PERIOD_FIELDS as readonly string[]).includes(key) &&
            (typeof value === 'string' || typeof value === 'number')
        ) {
            dates.push({ tool: toolName, field: key, value: String(value) });
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            extractDatesFromObject(value as Record<string, unknown>, toolName, dates, depth + 1);
        }
        if (Array.isArray(value)) {
            for (const item of value.slice(0, 5)) {
                // sample first 5
                if (item && typeof item === 'object') {
                    extractDatesFromObject(item as Record<string, unknown>, toolName, dates, depth + 1);
                }
            }
        }
    }
}

/** Extract dates from tool invocations in output messages */
function extractToolDates(output: ScorerRunOutputForAgent): ExtractedDate[] {
    const dates: ExtractedDate[] = [];
    const toolResults = extractToolResults(output);

    for (const tr of toolResults) {
        if (tr.result && typeof tr.result === 'object') {
            extractDatesFromObject(tr.result as Record<string, unknown>, tr.toolName, dates);
        }
    }

    return dates;
}

export const dataFreshnessScorer = createScorer({
    type: 'agent',
    id: 'data-freshness',
    description: 'Verify dates mentioned in agent text match actual dates from tool results',
    judge: {
        model: EVAL_CONFIG.JUDGE_MODEL,
        instructions:
            'You verify that dates mentioned in AI agent text responses match the actual dates from API tool results.',
    },
})
    .preprocess(({ run }) => {
        const toolDates = extractToolDates(run.output);
        const responseMessages = extractAgentResponseMessages(run.output);
        const textContent = responseMessages.join(' ');
        return { toolDates, textContent };
    })
    .analyze({
        description: 'Compare dates from tool results against dates mentioned in agent text',
        outputSchema: z.object({
            hasToolDates: z.boolean(),
            hasTextDates: z.boolean(),
            isConsistent: z.boolean(),
            toolDateSummary: z.string(),
            textDateSummary: z.string(),
            discrepancies: z.array(z.string()),
        }),
        createPrompt: ({ results }) => {
            const { toolDates, textContent } = results.preprocessStepResult;

            if (toolDates.length === 0) {
                return `No date fields found in tool results. Just return:
{ "hasToolDates": false, "hasTextDates": false, "isConsistent": true, "toolDateSummary": "none", "textDateSummary": "none", "discrepancies": [] }`;
            }

            const toolDateStr = toolDates
                .slice(0, 20)
                .map((d: ExtractedDate) => `${d.tool}.${d.field} = "${d.value}"`)
                .join('\n');

            return `Compare the dates from API tool results against the dates the agent mentions in its Hebrew text response.

## Tool Results (actual API data)
${toolDateStr}

## Agent Text Response
"${textContent.slice(0, 3000)}"

## Instructions
1. Extract all year/date references from the agent text (e.g., "2023", "\u05D9\u05E0\u05D5\u05D0\u05E8 2025", "\u05E2\u05D5\u05D3\u05DB\u05DF \u05D1-2024")
2. Compare with the tool dates above
3. A discrepancy is when:
   - Tool shows lastUpdated/lastUpdate in year X but agent text says data is from year Y (where Y < X)
   - Tool shows period/endPeriod from 2026 but agent claims data is from 2023
   - Agent fabricates a date not supported by any tool result
4. Minor year differences in series data are OK (e.g., "\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E2\u05D3 2025" when latest period is late 2025)

Return JSON: { hasToolDates, hasTextDates, isConsistent, toolDateSummary, textDateSummary, discrepancies }`;
        },
    })
    .generateScore(({ results }) => {
        const r = results.analyzeStepResult;
        if (!r.hasToolDates) return 1; // no tool dates => can't verify => pass
        if (!r.hasTextDates) return 0.8; // tool has dates but agent didn't mention them => minor issue
        if (r.isConsistent) return 1;
        // Penalize per discrepancy
        return Math.max(0, 1 - r.discrepancies.length * 0.3);
    })
    .generateReason(({ results, score }) => {
        const r = results.analyzeStepResult;
        if (!r.hasToolDates) return `No tool dates to verify. Score: ${score}`;
        if (r.isConsistent)
            return `Dates consistent. Tool: ${r.toolDateSummary}. Text: ${r.textDateSummary}. Score: ${score}`;
        return `Date discrepancies: ${r.discrepancies.join('; ')}. Tool: ${r.toolDateSummary}. Text: ${r.textDateSummary}. Score: ${score}`;
    });
