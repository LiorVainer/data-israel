## 1. Setup & Dependencies
- [x] 1.1 Install `@mastra/evals` package via pnpm
- [x] 1.2 Create `agents/evals/eval.config.ts` with judge model, sampling rates
```typescript
// agents/evals/eval.config.ts
export const EVAL_CONFIG = {
  JUDGE_MODEL: 'openrouter/google/gemini-2.0-flash-lite',
  LIVE_SAMPLING_RATE: 0.3,
  CRITICAL_SAMPLING_RATE: 1.0,
  SCORE_THRESHOLD: 0.7,  // Below this = "low score" for optimizer
  OPTIMIZER_MODEL: 'openrouter/anthropic/claude-sonnet-4-5',
} as const;
```
- [x] 1.3 Verify `tsc` passes after setup

## 2. Custom Scorers (each scorer = 1 file)
- [x] 2.1 Create `agents/evals/scorers/hebrew-output.scorer.ts`
```typescript
// Function-based scorer — Hebrew character ratio
import { createScorer } from '@mastra/core/evals';

export const hebrewOutputScorer = createScorer({
  type: 'agent',
  id: 'hebrew-output',
  description: 'Verify agent output is in Hebrew',
})
.preprocess(({ run }) => {
  const text = typeof run.output === 'string' ? run.output : JSON.stringify(run.output);
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const totalAlpha = (text.match(/[a-zA-Z\u0590-\u05FF]/g) || []).length;
  return { hebrewRatio: totalAlpha > 0 ? hebrewChars / totalAlpha : 1, hebrewChars, totalAlpha };
})
.generateScore(({ results }) => {
  const ratio = results.preprocessStepResult.hebrewRatio;
  if (ratio > 0.7) return 1;
  if (ratio < 0.3) return 0;
  return (ratio - 0.3) / 0.4;
})
.generateReason(({ results, score }) =>
  `Hebrew ratio: ${(results.preprocessStepResult.hebrewRatio * 100).toFixed(1)}%. Score: ${score}`
);
```

- [x] 2.2 Create `agents/evals/scorers/no-technical-leakage.scorer.ts`
```typescript
// Function-based — regex detection for UUIDs, JSON, API URLs, tool names
import { createScorer } from '@mastra/core/evals';

const LEAKAGE_PATTERNS = [
  { name: 'UUID', pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i },
  { name: 'JSON object', pattern: /\{[\s]*"[a-zA-Z_]+"\s*:/ },
  { name: 'data.gov.il API URL', pattern: /data\.gov\.il\/api\// },
  { name: 'CBS API URL', pattern: /apis\.cbs\.gov\.il\// },
  { name: 'Tool name', pattern: /\b(searchDatasets|queryDatastoreResource|getDatasetDetails|getResourceDetails|browseCbsCatalog|getCbsSeriesData|browseCbsPriceIndices|generateDataGovSourceUrl|generateCbsSourceUrl|suggestFollowUps)\b/ },
  { name: 'CKAN field', pattern: /\b(resource_id|package_id|metadata_modified|num_resources|datastore_active)\b/ },
];

export const noTechnicalLeakageScorer = createScorer({
  type: 'agent',
  id: 'no-tech-leakage',
  description: 'Detect technical details that should be hidden from users',
})
.preprocess(({ run }) => {
  const text = typeof run.output === 'string' ? run.output : JSON.stringify(run.output);
  const detected = LEAKAGE_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ name }) => name);
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
```

- [x] 2.3 Create `agents/evals/scorers/tool-compliance.scorer.ts`
```typescript
// LLM-based (prompt object) — evaluates tool usage evidence in output
import { createScorer } from '@mastra/core/evals';
import { z } from 'zod';
import { EVAL_CONFIG } from '../eval.config';

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
    const text = typeof run.output === 'string' ? run.output : JSON.stringify(run.output);
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
```

- [x] 2.4 Create `agents/evals/scorers/conciseness.scorer.ts`
```typescript
// Function-based — item count and structure analysis
import { createScorer } from '@mastra/core/evals';

export const concisenessScorer = createScorer({
  type: 'agent',
  id: 'conciseness',
  description: 'Evaluate output conciseness — item limits and structure',
})
.preprocess(({ run }) => {
  const text = typeof run.output === 'string' ? run.output : JSON.stringify(run.output);
  const bullets = (text.match(/^[\s]*[-•*]\s/gm) || []).length;
  const numberedItems = (text.match(/^[\s]*\d+[.)]\s/gm) || []).length;
  const tableRows = (text.match(/\|.*\|/g) || []).length;
  const totalItems = bullets + numberedItems + Math.max(0, tableRows - 1); // exclude header row
  const hasStructure = /[#*|\-]/.test(text);
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
```

- [x] 2.5 Create `agents/evals/scorers/source-attribution.scorer.ts`
```typescript
// Function-based — source URL / attribution detection
import { createScorer } from '@mastra/core/evals';

const SOURCE_PATTERNS = [
  /https?:\/\/data\.gov\.il/,           // data.gov.il links
  /https?:\/\/[^\s]+cbs\.gov\.il/,      // CBS links
  /מקור[:\s]/,                           // Hebrew "source:"
  /עודכן לאחרונה/,                       // Hebrew "last updated"
  /\[.*\]\(https?:\/\/[^\s)]+\)/,       // markdown links
];

export const sourceAttributionScorer = createScorer({
  type: 'agent',
  id: 'source-attribution',
  description: 'Check for source URL references when data is presented',
})
.preprocess(({ run }) => {
  const text = typeof run.output === 'string' ? run.output : JSON.stringify(run.output);
  const hasData = /\d{2,}/.test(text) && text.length > 200; // numbers + substantial content = data
  const sourcesFound = SOURCE_PATTERNS.filter(p => p.test(text)).length;
  return { hasData, sourcesFound, totalPatterns: SOURCE_PATTERNS.length };
})
.generateScore(({ results }) => {
  const { hasData, sourcesFound } = results.preprocessStepResult;
  if (!hasData) return 1; // no data presented → not applicable
  return Math.min(1, sourcesFound / 2); // need at least 2 source indicators for full score
})
.generateReason(({ results, score }) => {
  const { hasData, sourcesFound } = results.preprocessStepResult;
  if (!hasData) return `No data presented — attribution not required. Score: ${score}`;
  return `Source indicators found: ${sourcesFound}. Score: ${score}`;
});
```

- [x] 2.6 Create `agents/evals/scorers/data-freshness.scorer.ts`
```typescript
// LLM-based — cross-references dates in tool results vs dates mentioned in agent text
// Catches: tool returns lastUpdated=2026 but agent text says "נתונים מ-2023"
import { createScorer } from '@mastra/core/evals';
import { z } from 'zod';
import { EVAL_CONFIG } from '../eval.config';

/** Known date fields in tool results to extract */
const DATE_FIELDS = ['lastUpdated', 'lastUpdate', 'last_modified', 'lastModified', 'metadata_modified', 'metadata_created'];
const PERIOD_FIELDS = ['period', 'year', 'month', 'endPeriod', 'startPeriod'];

/** Extract dates from tool invocations in output messages */
function extractToolDates(output: unknown): Array<{ tool: string; field: string; value: string }> {
  const dates: Array<{ tool: string; field: string; value: string }> = [];
  if (!Array.isArray(output)) return dates;

  for (const msg of output) {
    const invocations = msg?.content?.toolInvocations ?? msg?.toolInvocations ?? [];
    for (const inv of invocations) {
      if (!inv?.result || typeof inv.result !== 'object') continue;
      const toolName = inv.toolName ?? 'unknown';
      extractDatesFromObject(inv.result, toolName, dates);
    }
  }
  return dates;
}

function extractDatesFromObject(
  obj: Record<string, unknown>,
  toolName: string,
  dates: Array<{ tool: string; field: string; value: string }>,
  depth = 0,
): void {
  if (depth > 4) return;
  for (const [key, value] of Object.entries(obj)) {
    if (DATE_FIELDS.includes(key) && typeof value === 'string' && value.length > 0) {
      dates.push({ tool: toolName, field: key, value });
    }
    if (PERIOD_FIELDS.includes(key) && (typeof value === 'string' || typeof value === 'number')) {
      dates.push({ tool: toolName, field: key, value: String(value) });
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      extractDatesFromObject(value as Record<string, unknown>, toolName, dates, depth + 1);
    }
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 5)) { // sample first 5
        if (item && typeof item === 'object') {
          extractDatesFromObject(item as Record<string, unknown>, toolName, dates, depth + 1);
        }
      }
    }
  }
}

/** Extract text content from output messages */
function extractTextContent(output: unknown): string {
  if (!Array.isArray(output)) return typeof output === 'string' ? output : JSON.stringify(output);
  return output
    .filter((msg: Record<string, unknown>) => msg?.role === 'assistant')
    .map((msg: Record<string, unknown>) => {
      if (typeof msg.content === 'string') return msg.content;
      const parts = (msg.content as Record<string, unknown>)?.parts;
      if (Array.isArray(parts)) {
        return parts
          .filter((p: Record<string, unknown>) => p?.type === 'text')
          .map((p: Record<string, unknown>) => p?.text ?? '')
          .join(' ');
      }
      return '';
    })
    .join(' ');
}

export const dataFreshnessScorer = createScorer({
  type: 'agent',
  id: 'data-freshness',
  description: 'Verify dates mentioned in agent text match actual dates from tool results',
  judge: {
    model: EVAL_CONFIG.JUDGE_MODEL,
    instructions: 'You verify that dates mentioned in AI agent text responses match the actual dates from API tool results.',
  },
})
.preprocess(({ run }) => {
  const toolDates = extractToolDates(run.output);
  const textContent = extractTextContent(run.output);
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
      .map(d => `${d.tool}.${d.field} = "${d.value}"`)
      .join('\n');

    return `Compare the dates from API tool results against the dates the agent mentions in its Hebrew text response.

## Tool Results (actual API data)
${toolDateStr}

## Agent Text Response
"${textContent.slice(0, 3000)}"

## Instructions
1. Extract all year/date references from the agent text (e.g., "2023", "ינואר 2025", "עודכן ב-2024")
2. Compare with the tool dates above
3. A discrepancy is when:
   - Tool shows lastUpdated/lastUpdate in year X but agent text says data is from year Y (where Y < X)
   - Tool shows period/endPeriod from 2026 but agent claims data is from 2023
   - Agent fabricates a date not supported by any tool result
4. Minor year differences in series data are OK (e.g., "נתונים עד 2025" when latest period is late 2025)

Return JSON: { hasToolDates, hasTextDates, isConsistent, toolDateSummary, textDateSummary, discrepancies }`;
  },
})
.generateScore(({ results }) => {
  const r = results.analyzeStepResult;
  if (!r.hasToolDates) return 1; // no tool dates → can't verify → pass
  if (!r.hasTextDates) return 0.8; // tool has dates but agent didn't mention them → minor issue
  if (r.isConsistent) return 1;
  // Penalize per discrepancy
  return Math.max(0, 1 - r.discrepancies.length * 0.3);
})
.generateReason(({ results, score }) => {
  const r = results.analyzeStepResult;
  if (!r.hasToolDates) return `No tool dates to verify. Score: ${score}`;
  if (r.isConsistent) return `Dates consistent. Tool: ${r.toolDateSummary}. Text: ${r.textDateSummary}. Score: ${score}`;
  return `Date discrepancies: ${r.discrepancies.join('; ')}. Tool: ${r.toolDateSummary}. Text: ${r.textDateSummary}. Score: ${score}`;
});
```

- [x] 2.7 Create `agents/evals/scorers/index.ts` — barrel export for all scorers
```typescript
export { hebrewOutputScorer } from './hebrew-output.scorer';
export { noTechnicalLeakageScorer } from './no-technical-leakage.scorer';
export { toolComplianceScorer } from './tool-compliance.scorer';
export { concisenessScorer } from './conciseness.scorer';
export { sourceAttributionScorer } from './source-attribution.scorer';
export { dataFreshnessScorer } from './data-freshness.scorer';
```

- [x] 2.8 Verify `tsc` passes with all scorers

## 3. Live Scorer Integration
- [x] 3.1 Update `agents/network/routing/routing.agent.ts` — add `scorers` config
```typescript
// Add to Agent constructor in createRoutingAgent():
import { hebrewOutputScorer, noTechnicalLeakageScorer, toolComplianceScorer, concisenessScorer, sourceAttributionScorer, dataFreshnessScorer } from '../../evals/scorers';
import { EVAL_CONFIG } from '../../evals/eval.config';

// Inside new Agent({ ... })
scorers: {
  hebrewOutput: { scorer: hebrewOutputScorer, sampling: { type: 'ratio', rate: EVAL_CONFIG.CRITICAL_SAMPLING_RATE } },
  noTechLeakage: { scorer: noTechnicalLeakageScorer, sampling: { type: 'ratio', rate: 0.5 } },
  toolCompliance: { scorer: toolComplianceScorer, sampling: { type: 'ratio', rate: EVAL_CONFIG.LIVE_SAMPLING_RATE } },
  conciseness: { scorer: concisenessScorer, sampling: { type: 'ratio', rate: EVAL_CONFIG.LIVE_SAMPLING_RATE } },
  sourceAttribution: { scorer: sourceAttributionScorer, sampling: { type: 'ratio', rate: EVAL_CONFIG.LIVE_SAMPLING_RATE } },
  dataFreshness: { scorer: dataFreshnessScorer, sampling: { type: 'ratio', rate: 0.5 } },
},
```

- [x] 3.2 Update `agents/network/datagov/data-gov.agent.ts` — same pattern as 3.1
- [x] 3.3 Update `agents/network/cbs/cbs.agent.ts` — same pattern as 3.1
- [x] 3.4 Update `agents/mastra.ts` — register all scorers on Mastra instance
```typescript
import { hebrewOutputScorer, noTechnicalLeakageScorer, toolComplianceScorer, concisenessScorer, sourceAttributionScorer, dataFreshnessScorer } from './evals/scorers';

export const mastra = new Mastra({
  agents,
  scorers: {
    hebrewOutput: hebrewOutputScorer,
    noTechLeakage: noTechnicalLeakageScorer,
    toolCompliance: toolComplianceScorer,
    conciseness: concisenessScorer,
    sourceAttribution: sourceAttributionScorer,
    dataFreshness: dataFreshnessScorer,
  },
  ...(storage && { storage }),
});
```

- [x] 3.5 Verify `tsc` and `npm run build` pass

## 4. CI/CD Eval Test Suites
- [x] 4.1 Create `agents/evals/__tests__/routing-agent.eval.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { runEvals } from '@mastra/core/evals';
import { routingAgent } from '../../network';
import { hebrewOutputScorer, noTechnicalLeakageScorer, toolComplianceScorer, dataFreshnessScorer } from '../scorers';

describe('Routing Agent Evals', () => {
  it('should delegate data.gov.il queries correctly', async () => {
    const result = await runEvals({
      data: [
        { input: 'חפש מאגרי נתונים על חינוך' },
        { input: 'כמה מאגרי מידע יש על תחבורה?' },
      ],
      target: routingAgent,
      scorers: [hebrewOutputScorer, noTechnicalLeakageScorer, toolComplianceScorer, dataFreshnessScorer],
    });
    expect(result.scores['hebrew-output']).toBeGreaterThan(0.8);
    expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.7);
  }, { timeout: 120_000 });

  it('should delegate CBS queries correctly', async () => {
    const result = await runEvals({
      data: [
        { input: 'מה מדד המחירים לצרכן?' },
        { input: 'מהי האוכלוסייה של תל אביב?' },
      ],
      target: routingAgent,
      scorers: [hebrewOutputScorer, noTechnicalLeakageScorer],
    });
    expect(result.scores['hebrew-output']).toBeGreaterThan(0.8);
  }, { timeout: 120_000 });
});
```

- [x] 4.2 Create `agents/evals/__tests__/datagov-agent.eval.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { runEvals } from '@mastra/core/evals';
import { datagovAgent } from '../../network';
import { hebrewOutputScorer, noTechnicalLeakageScorer, concisenessScorer, sourceAttributionScorer, dataFreshnessScorer } from '../scorers';

describe('DataGov Agent Evals', () => {
  it('should search and summarize datasets in Hebrew', async () => {
    const result = await runEvals({
      data: [
        { input: 'חפש מאגרי נתונים על בתי ספר' },
        { input: 'מצא מידע על תחבורה ציבורית' },
      ],
      target: datagovAgent,
      scorers: [hebrewOutputScorer, noTechnicalLeakageScorer, concisenessScorer, sourceAttributionScorer, dataFreshnessScorer],
    });
    expect(result.scores['hebrew-output']).toBe(1);
    expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.7);
    expect(result.scores['conciseness']).toBeGreaterThan(0.7);
  }, { timeout: 120_000 });
});
```

- [x] 4.3 Create `agents/evals/__tests__/cbs-agent.eval.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { runEvals } from '@mastra/core/evals';
import { cbsAgent } from '../../network';
import { hebrewOutputScorer, noTechnicalLeakageScorer, concisenessScorer, dataFreshnessScorer } from '../scorers';

describe('CBS Agent Evals', () => {
  it('should return statistical data in Hebrew', async () => {
    const result = await runEvals({
      data: [
        { input: 'מה מדד המחירים לצרכן?' },
        { input: 'חפש נתוני אוכלוסייה של חיפה' },
      ],
      target: cbsAgent,
      scorers: [hebrewOutputScorer, noTechnicalLeakageScorer, concisenessScorer, dataFreshnessScorer],
    });
    expect(result.scores['hebrew-output']).toBe(1);
    expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.7);
  }, { timeout: 120_000 });
});
```

- [x] 4.4 Verify test files compile with `tsc`

## 5. Prompt Optimization — Convex Backend
- [x] 5.1 Update `convex/schema.ts` — add `prompt_revisions` table
```typescript
// Add to schema:
prompt_revisions: defineTable({
  agentId: v.string(),
  currentPrompt: v.string(),
  proposedPrompt: v.string(),
  scoresSummary: v.any(),    // Record<scorerId, { avgScore, count }>
  failureCount: v.number(),
  model: v.string(),
  status: v.string(),        // "proposed" | "accepted" | "rejected"
  createdAt: v.number(),
}).index('by_agent', ['agentId', 'createdAt']),
```

- [x] 5.2 Create `convex/scores.ts` — query function for low-scoring results
```typescript
// convex/scores.ts
import { query } from './_generated/server';
import { v } from 'convex/values';

/** Query low-scoring results from mastra_scorers by agent ID */
export const getLowScores = query({
  args: {
    entityId: v.string(),
    maxScore: v.number(),
    since: v.optional(v.number()),   // timestamp ms
    limit: v.optional(v.number()),   // default 50
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let q = ctx.db
      .query('mastra_scorers')
      .withIndex('by_entity', (q) => q.eq('entityId', args.entityId));

    const results = await q.order('desc').collect();

    return results
      .filter((row) => {
        if (row.score >= args.maxScore) return false;
        if (args.since && row.createdAt < args.since) return false;
        return true;
      })
      .slice(0, limit);
  },
});
```

- [x] 5.3 Create `convex/promptRevisions.ts` — mutations for prompt revisions
```typescript
// convex/promptRevisions.ts
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const save = mutation({
  args: {
    agentId: v.string(),
    currentPrompt: v.string(),
    proposedPrompt: v.string(),
    scoresSummary: v.any(),
    failureCount: v.number(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('prompt_revisions', {
      ...args,
      status: 'proposed',
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('prompt_revisions'),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const listByAgent = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('prompt_revisions')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .order('desc')
      .take(20);
  },
});
```

## 6. Prompt Optimization — Script
- [x] 6.1 Create `agents/evals/optimizer/meta-prompt.ts` — meta-prompt template
```typescript
// agents/evals/optimizer/meta-prompt.ts

interface FailureGroup {
  scorerId: string;
  avgScore: number;
  examples: Array<{ input: string; output: string; score: number; reason: string }>;
}

export function buildMetaPrompt(agentId: string, currentPrompt: string, failures: FailureGroup[]): string {
  const failureSections = failures.map(({ scorerId, avgScore, examples }) => {
    const exampleText = examples.slice(0, 5).map((ex, i) =>
      `  Example ${i + 1} (score: ${ex.score.toFixed(2)}):
    Input: ${ex.input.slice(0, 200)}
    Output: ${ex.output.slice(0, 500)}
    Reason: ${ex.reason}`
    ).join('\n\n');

    return `### Scorer: ${scorerId} (avg score: ${avgScore.toFixed(2)})
${exampleText}`;
  }).join('\n\n');

  return `You are an expert prompt engineer specializing in Hebrew AI agent instructions.

## Task
Improve the system instruction for agent "${agentId}" to address the quality issues found by automated scorers.

## Current Instruction
\`\`\`
${currentPrompt}
\`\`\`

## Low-Scoring Examples (grouped by scorer)
${failureSections}

## Rules
1. Keep the instruction in Hebrew
2. Preserve ALL existing capabilities and rules — do not remove anything that works
3. Add specific guidance to address the failures shown above
4. Be concise — add minimal text to fix the issues
5. Return ONLY the revised instruction text, no explanation

## Revised Instruction`;
}
```

- [x] 6.2 Create `agents/evals/optimizer/read-agent-config.ts` — read current prompt by agent ID
```typescript
// agents/evals/optimizer/read-agent-config.ts
import { ROUTING_CONFIG } from '../../network/routing/config';
import { DATAGOV_AGENT_CONFIG } from '../../network/datagov/config';
import { CBS_AGENT_CONFIG } from '../../network/cbs/config';

const AGENT_CONFIGS: Record<string, { instructions: string }> = {
  routingAgent: ROUTING_CONFIG,
  datagovAgent: DATAGOV_AGENT_CONFIG,
  cbsAgent: CBS_AGENT_CONFIG,
};

export function getAgentPrompt(agentId: string): string {
  const config = AGENT_CONFIGS[agentId];
  if (!config) throw new Error(`Unknown agent: ${agentId}. Valid: ${Object.keys(AGENT_CONFIGS).join(', ')}`);
  return config.instructions;
}
```

- [x] 6.3 Create `scripts/optimize-prompts.ts` — main script with combinable output flags
```typescript
// scripts/optimize-prompts.ts
// Usage:
//   npx tsx scripts/optimize-prompts.ts routingAgent              # save to Convex only
//   npx tsx scripts/optimize-prompts.ts routingAgent --local       # save to Convex + local file
//   npx tsx scripts/optimize-prompts.ts routingAgent --local-only  # save to local file only
//   npx tsx scripts/optimize-prompts.ts routingAgent --threshold 0.5 --days 7

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { getAgentPrompt } from '../agents/evals/optimizer/read-agent-config';
import { buildMetaPrompt, type FailureGroup } from '../agents/evals/optimizer/meta-prompt';
import { EVAL_CONFIG } from '../agents/evals/eval.config';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const args = process.argv.slice(2);
const agentId = args[0];
const localOnly = args.includes('--local-only');
const saveLocal = localOnly || args.includes('--local');
const saveConvex = !localOnly;
const threshold = parseFloat(args[args.indexOf('--threshold') + 1] || String(EVAL_CONFIG.SCORE_THRESHOLD));
const days = parseInt(args[args.indexOf('--days') + 1] || '30', 10);

if (!agentId) {
  console.error('Usage: npx tsx scripts/optimize-prompts.ts <agentId> [--local] [--local-only] [--threshold N] [--days N]');
  process.exit(1);
}

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const since = Date.now() - days * 24 * 60 * 60 * 1000;

  // 1. Query low scores from Convex
  const lowScores = await client.query(api.scores.getLowScores, {
    entityId: agentId, maxScore: threshold, since, limit: 100,
  });

  if (lowScores.length === 0) { console.log(`No low scores found for ${agentId}. No optimization needed.`); return; }

  // 2. Group by scorer
  const groups = new Map<string, FailureGroup>();
  for (const row of lowScores) {
    const key = row.scorerId;
    if (!groups.has(key)) groups.set(key, { scorerId: key, avgScore: 0, examples: [] });
    const g = groups.get(key)!;
    g.examples.push({
      input: JSON.stringify(row.input).slice(0, 300),
      output: JSON.stringify(row.output).slice(0, 600),
      score: row.score, reason: row.reason ?? 'No reason provided',
    });
  }
  for (const g of groups.values()) {
    g.avgScore = g.examples.reduce((sum, e) => sum + e.score, 0) / g.examples.length;
  }

  // 3. Read current prompt
  const currentPrompt = getAgentPrompt(agentId);

  // 4. Build & send meta-prompt
  const metaPrompt = buildMetaPrompt(agentId, currentPrompt, [...groups.values()]);
  const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! });
  const { text: proposedPrompt } = await generateText({
    model: openrouter(EVAL_CONFIG.OPTIMIZER_MODEL.replace('openrouter/', '')),
    prompt: metaPrompt,
  });

  // 5. Output — save to Convex, local file, or both
  const scoresSummary = Object.fromEntries(
    [...groups.entries()].map(([k, g]) => [k, { avgScore: g.avgScore, count: g.examples.length }])
  );

  if (saveLocal) {
    const fs = await import('fs');
    const dir = 'agents/evals/proposed-prompts';
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${dir}/${agentId}-${new Date().toISOString().slice(0, 10)}.md`;
    fs.writeFileSync(filename, `# Proposed Prompt: ${agentId}\n\n## Scores Summary\n${JSON.stringify(scoresSummary, null, 2)}\n\n## Proposed Prompt\n${proposedPrompt}`);
    console.log(`Written to ${filename}`);
  }

  if (saveConvex) {
    await client.mutation(api.promptRevisions.save, {
      agentId, currentPrompt, proposedPrompt,
      scoresSummary, failureCount: lowScores.length,
      model: EVAL_CONFIG.OPTIMIZER_MODEL,
    });
    console.log(`Saved prompt revision to Convex for ${agentId} (${lowScores.length} failures analyzed)`);
  }
}

main().catch(console.error);
```

- [x] 6.4 Add npm scripts to `package.json`
```json
"eval:routing": "vitest run agents/evals/__tests__/routing-agent.eval.ts",
"eval:datagov": "vitest run agents/evals/__tests__/datagov-agent.eval.ts",
"eval:cbs": "vitest run agents/evals/__tests__/cbs-agent.eval.ts",
"eval:all": "vitest run agents/evals/__tests__/",
"optimize-prompts": "tsx scripts/optimize-prompts.ts"
```

- [x] 6.5 Verify `tsc` passes with all new files

## 7. CI/CD — GitHub Actions
- [x] 7.1 Create `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    # Runs on all PRs, not restricted to main target

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: npx tsc --noEmit
      - run: pnpm build
      - run: pnpm lint
      - run: pnpm test -- --exclude '**/agents/evals/**'
        # Eval tests excluded — they require OPENROUTER_API_KEY

  eval-tests:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm run eval:all
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

## 8. Verification
- [x] 8.1 Run `tsc` — zero errors
- [x] 8.2 Run `npm run build` — build succeeds
- [x] 8.3 Run `npm run lint` — no new lint errors
- [x] 8.4 Run `npm run vibecheck` — no score regression
- [x] 8.5 Run unit tests: `pnpm test -- --exclude '**/agents/evals/**'`
- [ ] 8.6 Run eval tests locally (requires API keys): `pnpm test -- --testPathPattern 'agents/evals'`
