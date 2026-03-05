# Mastra Evals Plan — Agent Network Scorers

**Research:** `docs/research/2026-03-04-mastra-evals-research.md`
**Branch:** `feat/add-agent-evals`
**Package needed:** `@mastra/evals`

---

## Overview

Add Mastra scorers (evals) to evaluate all 3 agents (routing, datagov, cbs) with:
1. **Live scorers** — attached to agents, run in production with sampling
2. **CI/CD test cases** — `runEvals()` in Vitest test files

### Scorer Design

All custom scorers use `type: 'agent'` for compatibility with both live and trace evaluation.

---

## Phase 1: Setup & Dependencies

### 1.1 Install `@mastra/evals`
```bash
pnpm add @mastra/evals
```

### 1.2 Create eval directory structure
```
agents/
  evals/
    scorers/             # Custom scorers
      hebrew-output.scorer.ts
      no-technical-leakage.scorer.ts
      tool-compliance.scorer.ts
      conciseness.scorer.ts
      source-attribution.scorer.ts
    __tests__/           # CI/CD eval test files
      routing-agent.eval.ts
      datagov-agent.eval.ts
      cbs-agent.eval.ts
    eval.config.ts       # Shared eval config (judge model, etc.)
```

### 1.3 Eval config
```typescript
// agents/evals/eval.config.ts
export const EVAL_CONFIG = {
  /** Judge model for LLM-based scorers (cheap + fast) */
  JUDGE_MODEL: 'openrouter/google/gemini-2.0-flash-lite',
  /** Sampling rate for live evals (0-1) */
  LIVE_SAMPLING_RATE: 0.3,
  /** Sampling rate for critical scorers */
  CRITICAL_SAMPLING_RATE: 1.0,
} as const;
```

---

## Phase 2: Custom Scorers

### 2.1 Hebrew Output Scorer
**Purpose:** Verify agent output is in Hebrew (not English/mixed).
**Type:** Function-based (no LLM needed)
**Pipeline:**
- `preprocess` — extract text content from agent output
- `generateScore` — detect Hebrew character ratio (>70% Hebrew chars → 1.0, <30% → 0.0, linear between)
- `generateReason` — report Hebrew character percentage

```typescript
createScorer({
  type: 'agent',
  id: 'hebrew-output',
  description: 'Verify agent output is in Hebrew',
})
.preprocess(({ run }) => {
  const text = run.output.text;
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const totalAlpha = (text.match(/[a-zA-Z\u0590-\u05FF]/g) || []).length;
  return { hebrewRatio: totalAlpha > 0 ? hebrewChars / totalAlpha : 1, hebrewChars, totalAlpha };
})
.generateScore(({ results }) => {
  const ratio = results.preprocessStepResult.hebrewRatio;
  if (ratio > 0.7) return 1;
  if (ratio < 0.3) return 0;
  return (ratio - 0.3) / 0.4; // Linear interpolation
})
.generateReason(({ results, score }) => {
  const { hebrewRatio } = results.preprocessStepResult;
  return `Hebrew character ratio: ${(hebrewRatio * 100).toFixed(1)}%. Score: ${score}`;
});
```

**Applies to:** All agents
**Live sampling:** 1.0 (critical — always score)

---

### 2.2 No Technical Leakage Scorer
**Purpose:** Detect IDs, raw JSON, API URLs, tool names, or internal field names in agent output.
**Type:** Function-based with regex patterns
**Pipeline:**
- `preprocess` — extract text
- `analyze` — scan for leakage patterns: UUIDs, JSON blobs, `api/3/action/`, field names like `resource_id`, tool names like `searchDatasets`
- `generateScore` — 1.0 if no leakage found, penalize per leak detected
- `generateReason` — list detected leaks

**Leakage patterns to detect:**
- UUID patterns: `/[0-9a-f]{8}-[0-9a-f]{4}-/`
- Raw JSON: `/\{["\s]*[a-zA-Z_]+["\s]*:/` (object literals with English keys)
- API URLs: `/data\.gov\.il\/api\//`, `/apis\.cbs\.gov\.il\//`
- Tool names: `searchDatasets`, `queryDatastoreResource`, `browseCbsCatalog`, etc.
- Field names: `resource_id`, `package_id`, `metadata_modified`, `num_resources`

**Applies to:** All agents
**Live sampling:** 0.5

---

### 2.3 Tool Compliance Scorer (LLM-based)
**Purpose:** Verify agents use tools in the correct order and call required tools.
**Type:** LLM-based (prompt object) — analyzes tool call traces
**Pipeline:**
- `preprocess` — extract tool call names and order from agent trace
- `analyze` (prompt object) — LLM judge evaluates: correct tool selection, proper ordering, suggestFollowUps called last (routing), source URLs generated
- `generateScore` — compliance ratio from analysis
- `generateReason` (prompt object) — explain compliance issues

**Agent-specific rules:**
- **Routing:** Must delegate to sub-agents before charts, `suggestFollowUps` must be last
- **DataGov:** Must follow searchDatasets → getDatasetDetails → queryDatastoreResource flow
- **CBS:** Must use appropriate tools for the query type (series vs prices vs localities)

**Applies to:** All agents (via trace evaluation only — not live, since tool calls aren't in `output.text`)
**Used in:** CI/CD `runEvals()` only

---

### 2.4 Conciseness Scorer
**Purpose:** Verify output is concise (not dumping raw data, respects item limits).
**Type:** Function-based
**Pipeline:**
- `preprocess` — count items (bullet points, table rows, numbered lists)
- `generateScore` — penalize if >15 items, >2000 chars without structure, or raw JSON detected
- `generateReason` — report item count and length

**Applies to:** All agents
**Live sampling:** 0.3

---

### 2.5 Source Attribution Scorer
**Purpose:** Verify that when data is retrieved, source URLs are generated.
**Type:** Function-based (trace analysis)
**Pipeline:**
- `preprocess` — scan for data tool calls (searchDatasets, getCbsSeriesData, etc.) and source URL tool calls
- `generateScore` — ratio of data retrievals that have corresponding source URL calls

**Applies to:** DataGov and CBS agents (via trace)
**Used in:** CI/CD only

---

## Phase 3: Live Scorer Integration

### 3.1 Attach live scorers to agent constructors

Update `createRoutingAgent`, `createDatagovAgent`, `createCbsAgent` to accept optional scorers:

```typescript
// routing.agent.ts
export function createRoutingAgent(modelId: string, subAgents: Record<string, Agent>): Agent {
  return new Agent({
    // ...existing config...
    scorers: {
      hebrewOutput: {
        scorer: hebrewOutputScorer,
        sampling: { type: 'ratio', rate: EVAL_CONFIG.CRITICAL_SAMPLING_RATE },
      },
      noTechLeakage: {
        scorer: noTechnicalLeakageScorer,
        sampling: { type: 'ratio', rate: EVAL_CONFIG.LIVE_SAMPLING_RATE },
      },
      conciseness: {
        scorer: concisenessScorer,
        sampling: { type: 'ratio', rate: EVAL_CONFIG.LIVE_SAMPLING_RATE },
      },
    },
  });
}
```

Same pattern for datagov and cbs agents.

### 3.2 Register scorers on Mastra instance (for trace evaluation in Studio)

```typescript
// mastra.ts
export const mastra = new Mastra({
  agents,
  scorers: {
    hebrewOutput: hebrewOutputScorer,
    noTechLeakage: noTechnicalLeakageScorer,
    conciseness: concisenessScorer,
    toolCompliance: toolComplianceScorer,
    sourceAttribution: sourceAttributionScorer,
  },
  ...(storage && { storage }),
});
```

---

## Phase 4: CI/CD Test Cases (`runEvals`)

### 4.1 Routing Agent Eval Tests

```typescript
// agents/evals/__tests__/routing-agent.eval.ts
describe('Routing Agent Evals', () => {
  it('should delegate data.gov.il queries to datagovAgent', async () => {
    const result = await runEvals({
      data: [
        { input: 'חפש מאגרי נתונים על חינוך' },
        { input: 'כמה מאגרי מידע יש על תחבורה?' },
      ],
      target: routingAgent,
      scorers: [hebrewOutputScorer, noTechLeakageScorer, concisenessScorer],
    });
    expect(result.scores['hebrew-output']).toBeGreaterThan(0.8);
    expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.8);
  });

  it('should delegate CBS queries to cbsAgent', async () => {
    const result = await runEvals({
      data: [
        { input: 'מה מדד המחירים לצרכן החודשי?' },
        { input: 'מהי האוכלוסייה של תל אביב?' },
      ],
      target: routingAgent,
      scorers: [hebrewOutputScorer, noTechLeakageScorer],
    });
    expect(result.scores['hebrew-output']).toBeGreaterThan(0.8);
  });

  it('should always call suggestFollowUps', async () => {
    const result = await runEvals({
      data: [{ input: 'חפש מאגרי נתונים על בריאות' }],
      target: routingAgent,
      scorers: [toolComplianceScorer],
    });
    expect(result.scores['tool-compliance']).toBeGreaterThan(0.7);
  });
});
```

### 4.2 DataGov Agent Eval Tests

```typescript
// agents/evals/__tests__/datagov-agent.eval.ts
describe('DataGov Agent Evals', () => {
  it('should search and summarize datasets in Hebrew', async () => {
    const result = await runEvals({
      data: [
        { input: 'חפש מאגרי נתונים על בתי ספר' },
        { input: 'מצא מידע על תחבורה ציבורית' },
      ],
      target: datagovAgent,
      scorers: [hebrewOutputScorer, noTechLeakageScorer, concisenessScorer],
    });
    expect(result.scores['hebrew-output']).toBe(1);
    expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.7);
    expect(result.scores['conciseness']).toBeGreaterThan(0.7);
  });

  it('should generate source URLs for retrieved data', async () => {
    const result = await runEvals({
      data: [{ input: 'חפש מאגר נתונים על רכבת ישראל' }],
      target: datagovAgent,
      scorers: [sourceAttributionScorer],
    });
    expect(result.scores['source-attribution']).toBeGreaterThan(0.5);
  });
});
```

### 4.3 CBS Agent Eval Tests

```typescript
// agents/evals/__tests__/cbs-agent.eval.ts
describe('CBS Agent Evals', () => {
  it('should return statistical data in Hebrew with proper formatting', async () => {
    const result = await runEvals({
      data: [
        { input: 'מה מדד המחירים לצרכן?' },
        { input: 'חפש נתוני אוכלוסייה של חיפה' },
      ],
      target: cbsAgent,
      scorers: [hebrewOutputScorer, noTechLeakageScorer, concisenessScorer],
    });
    expect(result.scores['hebrew-output']).toBe(1);
    expect(result.scores['no-tech-leakage']).toBeGreaterThan(0.7);
  });
});
```

---

## Phase 5: Verification

### 5.1 Build verification
```bash
tsc
npm run build
npm run lint
```

### 5.2 Run eval tests
```bash
npx vitest run agents/evals/__tests__/
```

### 5.3 Verify live scorers don't block agent responses (async execution)

---

## Summary: Scorer Matrix

| Scorer | Type | Live | CI/CD | Routing | DataGov | CBS |
|--------|------|------|-------|---------|---------|-----|
| hebrew-output | Function | 1.0 | Yes | Yes | Yes | Yes |
| no-tech-leakage | Function | 0.5 | Yes | Yes | Yes | Yes |
| conciseness | Function | 0.3 | Yes | Yes | Yes | Yes |
| tool-compliance | LLM | No | Yes | Yes | Yes | Yes |
| source-attribution | Function | No | Yes | No | Yes | Yes |

### File Inventory

| File | Purpose |
|------|---------|
| `agents/evals/eval.config.ts` | Shared eval config |
| `agents/evals/scorers/hebrew-output.scorer.ts` | Hebrew language verification |
| `agents/evals/scorers/no-technical-leakage.scorer.ts` | Technical detail detection |
| `agents/evals/scorers/tool-compliance.scorer.ts` | Tool usage pattern validation |
| `agents/evals/scorers/conciseness.scorer.ts` | Output length/structure check |
| `agents/evals/scorers/source-attribution.scorer.ts` | Source URL generation check |
| `agents/evals/__tests__/routing-agent.eval.ts` | Routing agent CI tests |
| `agents/evals/__tests__/datagov-agent.eval.ts` | DataGov agent CI tests |
| `agents/evals/__tests__/cbs-agent.eval.ts` | CBS agent CI tests |
| `agents/network/routing/routing.agent.ts` | Updated with live scorers |
| `agents/network/datagov/data-gov.agent.ts` | Updated with live scorers |
| `agents/network/cbs/cbs.agent.ts` | Updated with live scorers |
| `agents/mastra.ts` | Updated with instance-level scorers |

### Estimated Changes
- **New files:** 9
- **Modified files:** 4
- **New dependency:** `@mastra/evals`
