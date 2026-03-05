## Context
The agent network serves Hebrew-speaking users querying Israeli open data. Three agents (routing, datagov, cbs) must produce Hebrew output, hide technical details, use tools correctly, generate source URLs, and stay concise. There is no automated quality evaluation today.

Mastra provides a scorer system with `createScorer()` (4-step pipeline: preprocess → analyze → generateScore → generateReason) and two evaluation modes: live (attached to agents, async in production) and CI/CD (`runEvals()` in test files).

## Goals
- Detect regressions in agent output quality automatically
- Monitor live production outputs with sampling
- Run deterministic eval suites in CI/CD
- Keep scorers lightweight — avoid expensive LLM calls where regex/heuristics suffice
- **Close the feedback loop:** Use accumulated low-scoring results from `mastra_scorers` in Convex to automatically propose improved agent instruction prompts

## Non-Goals
- Full regression test suite (unit tests for tools already exist separately)
- Custom Mastra Studio UI
- Alerting/notification on score drops (future work)
- Automatic prompt deployment (the optimizer produces suggestions; human reviews and merges)

## Decisions

### Judge model
- **Decision:** Use `openrouter/google/gemini-2.0-flash-lite` as the LLM judge for prompt-object steps
- **Why:** Cheapest available model through existing OpenRouter setup; judge tasks are simple classification
- **Alternative:** `openai/gpt-4.1-nano` — used in Mastra docs but requires separate OpenAI key

### All 6 scorers live
- **Decision:** All scorers run as live evaluations (attached to agents), not just CI/CD
- **Why:** User requested all scorers be live for continuous monitoring
- **Sampling rates:** Hebrew (1.0 — critical), tech leakage (0.5), data freshness (0.5), conciseness (0.3), tool compliance (0.3), source attribution (0.3)
- **Note:** Tool compliance and source attribution scorers analyze `run.output` text for evidence of tool usage patterns since live scorers only see the agent's text output, not internal traces

### Scorer type
- **Decision:** All scorers use `type: 'agent'` for compatibility with both live and trace scoring
- **Why:** Allows reuse across live evaluation and Studio trace scoring

### Function-based vs LLM-based
- **Decision:** 4 function-based scorers (hebrew-output, no-tech-leakage, conciseness, source-attribution) + 2 LLM-based scorers (tool-compliance, data-freshness)
- **Why:** Regex/heuristic patterns are deterministic, faster, and cheaper; tool compliance and data freshness need nuanced judgment (comparing dates across tool results and text requires LLM interpretation)

### Data freshness scorer — design
- **Decision:** LLM-based scorer that cross-references dates in tool results against dates mentioned in agent text
- **Problem:** Agents sometimes report stale dates (e.g., "data from 2023") when tool results actually show current data (e.g., `lastUpdated: 2026`). This is a critical trust issue.
- **How it works:**
  1. `preprocess` extracts date fields from `run.output` tool invocations (`lastUpdated`, `lastUpdate`, `last_modified`, `period`, `year`, `month`, `endPeriod`) + extracts text content
  2. `analyze` (LLM judge) compares tool dates against dates mentioned in the Hebrew text
  3. Flags discrepancies where agent text claims older dates than what tools returned
- **Data source fields:**
  - DataGov: `getDatasetDetails.lastUpdated` (computed max of resource `last_modified`), `getResourceDetails.lastModified`
  - CBS: `getCbsSeriesData.lastUpdate`, `period` observations, `getCbsPriceData.year`/`month`
- **Live sampling:** 0.5 (important but LLM-based = more expensive)
- **Why LLM needed:** Hebrew date formats are varied ("ינואר 2025", "עודכן ב-2024", "נתונים מ-2023"), and comparing them against ISO timestamps or period strings requires interpretation, not just regex

### Storage
- **Decision:** Scorer results stored in `mastra_scorers` table via existing Convex storage
- **Why:** Leverages existing ConvexStore infrastructure; no new storage setup needed

### Prompt optimization — data source
- **Decision:** Read low-scoring results directly from `mastra_scorers` Convex table, NOT by re-running evals
- **Why:** Live scorers continuously accumulate real production data in Convex. Re-running evals is wasteful — the data already exists. The optimizer reads historical scores, filters by threshold, groups by agent + scorer, and feeds failure examples to a meta-prompt.
- **Data available per score row (from `ScoreRowData`):**
  - `entityId` — agent ID (routingAgent, datagovAgent, cbsAgent)
  - `scorerId` — which scorer produced this score
  - `input` — the user's input (typed as `ScorerRunInputForAgent` which includes `inputMessages`, `rememberedMessages`, `systemMessages`, `taggedSystemMessages`)
  - `output` — the agent's output messages
  - `score` — numerical score (0-1)
  - `reason` — human-readable explanation of why the score was given
  - `analyzeStepResult` — structured analysis data from the scorer
  - `source` — "LIVE" or "TEST"
  - `createdAt` — timestamp for filtering by time window

### Prompt optimization — architecture
- **Decision:** TypeScript script at `scripts/optimize-prompts.ts` with combinable output modes
- **Flow:**
  1. Query `mastra_scorers` via Convex query for scores below threshold (e.g., < 0.7), filtered by agent + time window
  2. Group failures by scorer type → extract `input`, `output`, `reason`, and `score` from each
  3. Read the current instruction prompt from the agent's config file
  4. Build meta-prompt: current instruction + failure examples grouped by scorer + ask LLM to produce revised instruction
  5. **Output modes (combinable flags):**
     - **Default:** Save to `prompt_revisions` Convex table
     - **`--local`:** Also write to local file at `agents/evals/proposed-prompts/<agentId>-<date>.md` (in addition to Convex)
     - **`--local-only`:** Write to local file only, skip Convex save
  6. Optionally re-run the same scorer on a sample of the failure cases with the proposed prompt to validate improvement
- **Why combinable modes:** Convex storage allows reviewing prompt revision history from anywhere; `--local` adds a local copy for easy review; `--local-only` works without Convex access

### Prompt revisions table
- **Decision:** New `prompt_revisions` Convex table to persist optimization results
- **Schema:**
  - `agentId` — which agent this revision targets
  - `currentPrompt` — the instruction prompt at time of optimization
  - `proposedPrompt` — the LLM-proposed revision
  - `scoresSummary` — aggregated scores that triggered this revision (scorer → avg score + count)
  - `failureCount` — total number of low-scoring results analyzed
  - `model` — which LLM generated the revision
  - `status` — "proposed" | "accepted" | "rejected" (human sets this after review)
  - `createdAt` — timestamp
- **Indexes:** `by_agent` (agentId, createdAt) for querying revisions per agent

### Prompt optimization — meta-prompt model
- **Decision:** Use a strong model (e.g., `openrouter/anthropic/claude-sonnet-4-5` or `openrouter/google/gemini-2.5-pro`) for the meta-prompt, not the cheap judge model
- **Why:** Prompt revision requires nuanced understanding of Hebrew instruction quality; a cheap model may produce worse prompts

### Completion scoring — not applicable
- **Decision:** Do NOT use Mastra's built-in completion scoring (`CompletionConfig`)
- **Why:** This project uses `handleChatStream` (from `@mastra/ai-sdk`), not `agent.network()`. Completion scoring only works with `agent.network()` which is the agentic loop API. `handleChatStream` is the streaming chat API used for the Next.js route handler and does not support completion config.
- **Alternative considered:** Wrapping the chat flow with `agent.network()` would require significant refactoring of the streaming architecture for marginal benefit.

## Risks / Trade-offs
- **Live scorer overhead:** Async execution mitigates latency impact; sampling reduces load
- **Hebrew regex limitations:** Character-ratio approach may misclassify mixed Hebrew/English content with English proper nouns — acceptable trade-off vs LLM cost
- **Tool compliance in live mode:** Only sees final text output, not tool traces — can detect mentions of tool names or raw data patterns but not full call ordering. Full trace analysis available via CI/CD `runEvals()` and Studio trace scoring.
- **Prompt optimization risk:** LLM-proposed prompts may regress on dimensions not measured by scorers. Mitigation: human review + optional re-scoring before applying.
- **Convex query cost:** Querying large volumes of score rows may be slow. Mitigation: add time-window filter and pagination; index by entityId + score in Convex schema.

### CI/CD Pipeline
- **Decision:** Add GitHub Actions workflow (`.github/workflows/ci.yml`) to run on every PR (any branch) and push to main
- **Why:** Project currently has no CI — `vitest run` and type checking should run automatically
- **Trigger:** `on: push: branches: [main]` + `on: pull_request:` (all PRs, not restricted to main target)
- **Steps:** Install deps → `tsc` → `npm run build` → `npm run lint` → `vitest run`
- **Eval tests:** Separate job, runs on all PRs and push to main (require API key secrets configured in GitHub).

### npm scripts
- **Decision:** Add convenience npm scripts for running evals and optimizer
- **Scripts:**
  - `eval:routing` — run routing agent eval tests
  - `eval:datagov` — run datagov agent eval tests
  - `eval:cbs` — run CBS agent eval tests
  - `eval:all` — run all eval tests
  - `optimize-prompts` — run prompt optimization script

## Open Questions
- None — all decisions made based on user requirements and Mastra API constraints
