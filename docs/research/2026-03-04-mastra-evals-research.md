# Mastra Evals Research — 2026-03-04

## What Are Mastra Evals (Scorers)?

Mastra's eval system is called **Scorers** — automated tests that evaluate agent outputs using model-graded, rule-based, and statistical methods. Scorers return numerical **scores** (typically 0-1).

### Two Evaluation Modes

1. **Live Evaluations** — scorers attached to agents via `scorers: {}` config, run asynchronously in production on every response (with sampling control). Results stored in `mastra_scorers` table.

2. **CI/CD Evaluations** — `runEvals()` function runs test cases through agents with scorers, returns aggregate scores. Used in Vitest/Jest.

### Key API

```typescript
import { createScorer, runEvals } from '@mastra/core/evals';
import { createAnswerRelevancyScorer } from '@mastra/evals/scorers/prebuilt';

// Live: attach to agent
new Agent({
  scorers: {
    relevancy: {
      scorer: createAnswerRelevancyScorer({ model: 'openai/gpt-4.1-nano' }),
      sampling: { type: 'ratio', rate: 0.5 },
    },
  },
});

// CI/CD: run evals
const result = await runEvals({
  data: [{ input: 'query', groundTruth: 'expected' }],
  target: myAgent,
  scorers: [myScorer],
});
```

### Custom Scorer Pipeline

`createScorer()` with 4-step pipeline:
1. **preprocess** (optional) — prepare/transform data
2. **analyze** (optional) — evaluate (function or LLM prompt object)
3. **generateScore** (required) — return numerical score
4. **generateReason** (optional) — human-readable explanation

For agent evaluation, use `type: 'agent'`:
```typescript
createScorer({ type: 'agent', id: '...', description: '...' })
```

### Built-in Scorers (from @mastra/evals)

- `createAnswerRelevancyScorer` — query-answer alignment
- `createAnswerSimilarityScorer` — output vs ground truth (needs groundTruth)
- `createBiasScorer` — gender/political/racial/geographical bias
- `createCompletenessScorer` — element coverage (no LLM needed)
- `createContentSimilarityScorer` — textual similarity
- `createToxicityScorer` — harmful content detection
- `createFaithfulnessScorer` — factual consistency
- `createHallucinationScorer` — invented information
- `createKeywordCoverageScorer` — keyword matching
- `createTextualDifferenceScorer` — string diff

### Package Required

```bash
pnpm add @mastra/evals
```

## Agent Network Analysis — Expected Outputs

### Routing Agent (סוכן ניתוב)
**Expected behaviors:**
- Hebrew-only responses
- Delegates to correct sub-agent (datagovAgent for data.gov.il queries, cbsAgent for statistical queries)
- Never exposes technical details (IDs, tool names, routing logic)
- Summarizes sub-agent results (10-15 items max)
- Always calls `suggestFollowUps` AFTER all delegations complete
- Creates charts when requested (using displayBarChart/displayLineChart/displayPieChart)
- Shows "last updated" dates when available
- Never guesses data — says explicitly when no data found

### DataGov Agent (סוכן data.gov.il)
**Expected behaviors:**
- Hebrew-only concise summaries (never raw JSON/API data)
- Follows workflow: searchDatasets → getDatasetDetails → getResourceDetails → queryDatastoreResource → generateDataGovSourceUrl
- Hides IDs, filenames, technical terms
- Limits to 10-15 items
- Reports "last updated" from lastUpdated field (not metadata_modified)
- Clearly reports when no relevant data found
- Calls generateDataGovSourceUrl for source links

### CBS Agent (סוכן הלמ"ס)
**Expected behaviors:**
- Hebrew-only concise summaries
- Uses tables with Hebrew labels for statistical data
- Shows date ranges and data point counts for time series
- Explains CPI calculations in simple language
- Hides series IDs, internal codes, API structure
- Limits to 10-15 items
- Reports lastUpdate from series data
- Calls generateCbsSourceUrl for source links

## Common Quality Dimensions Across All Agents

1. **Hebrew Language** — all output must be in Hebrew
2. **No Technical Leakage** — no IDs, JSON, API details, tool names
3. **Conciseness** — max 10-15 items, summaries not raw data
4. **Tool Usage Compliance** — correct tools called in correct order
5. **Source Attribution** — source URLs generated when data retrieved
6. **Last Updated Dates** — shown when available
7. **Graceful No-Data** — explicit "not found" rather than hallucination
