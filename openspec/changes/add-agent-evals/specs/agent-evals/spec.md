## ADDED Requirements

### Requirement: Eval Configuration
The system SHALL provide a shared eval configuration module defining the judge model, sampling rates, and scorer constants used across all agent evaluations.

#### Scenario: Default config values
- **WHEN** the eval config is imported
- **THEN** it SHALL export a JUDGE_MODEL string, LIVE_SAMPLING_RATE number, and CRITICAL_SAMPLING_RATE number

#### Scenario: Judge model uses OpenRouter
- **WHEN** an LLM-based scorer needs a judge model
- **THEN** it SHALL use the configured OpenRouter model ID (e.g., `openrouter/google/gemini-2.0-flash-lite`)

---

### Requirement: Hebrew Output Scorer
The system SHALL provide a function-based scorer that evaluates whether agent output text is in Hebrew by analyzing the ratio of Hebrew characters to total alphabetic characters.

#### Scenario: Fully Hebrew output
- **WHEN** agent output contains >70% Hebrew alphabetic characters
- **THEN** the scorer SHALL return a score of 1.0

#### Scenario: Mixed language output
- **WHEN** agent output contains between 30% and 70% Hebrew alphabetic characters
- **THEN** the scorer SHALL return a score between 0.0 and 1.0 via linear interpolation

#### Scenario: Non-Hebrew output
- **WHEN** agent output contains <30% Hebrew alphabetic characters
- **THEN** the scorer SHALL return a score of 0.0

#### Scenario: Empty or no-alpha output
- **WHEN** agent output contains no alphabetic characters
- **THEN** the scorer SHALL return a score of 1.0 (benefit of the doubt)

---

### Requirement: No Technical Leakage Scorer
The system SHALL provide a function-based scorer that detects technical details in agent output that should be hidden from users, including UUIDs, raw JSON, API URLs, internal tool names, and CKAN/CBS field names.

#### Scenario: Clean output
- **WHEN** agent output contains no technical patterns
- **THEN** the scorer SHALL return a score of 1.0

#### Scenario: UUID detected
- **WHEN** agent output contains a UUID pattern (e.g., `d882fbb6-1234-...`)
- **THEN** the scorer SHALL penalize the score

#### Scenario: Raw JSON detected
- **WHEN** agent output contains JSON object literals with English keys
- **THEN** the scorer SHALL penalize the score

#### Scenario: API URL detected
- **WHEN** agent output contains `data.gov.il/api/` or `apis.cbs.gov.il/`
- **THEN** the scorer SHALL penalize the score

#### Scenario: Tool name detected
- **WHEN** agent output contains internal tool names (e.g., `searchDatasets`, `queryDatastoreResource`, `browseCbsCatalog`)
- **THEN** the scorer SHALL penalize the score

---

### Requirement: Tool Compliance Scorer
The system SHALL provide an LLM-based scorer that evaluates whether agent output demonstrates correct tool usage patterns — proper delegation, correct ordering, and required tool calls.

#### Scenario: Routing agent calls suggestFollowUps
- **WHEN** the routing agent's output is evaluated
- **THEN** the scorer SHALL check for evidence that follow-up suggestions were provided

#### Scenario: Data retrieval with source attribution
- **WHEN** an agent's output presents data from external sources
- **THEN** the scorer SHALL check for evidence of source URL references

#### Scenario: No data hallucination
- **WHEN** an agent's output is evaluated
- **THEN** the scorer SHALL check that claims are presented as sourced from tools, not as unsupported assertions

---

### Requirement: Conciseness Scorer
The system SHALL provide a function-based scorer that evaluates whether agent output respects length and structure guidelines — limiting items to 10-15, using structured formatting, and avoiding raw data dumps.

#### Scenario: Well-structured output
- **WHEN** agent output contains ≤15 structured items (bullets, table rows, numbered items)
- **THEN** the scorer SHALL return a score of 1.0

#### Scenario: Excessive items
- **WHEN** agent output contains >15 items in a single list or table
- **THEN** the scorer SHALL penalize the score proportionally

#### Scenario: Unstructured wall of text
- **WHEN** agent output exceeds 2000 characters without structural elements (headers, lists, tables)
- **THEN** the scorer SHALL penalize the score

---

### Requirement: Source Attribution Scorer
The system SHALL provide a function-based scorer that evaluates whether agent output includes source references when presenting data — checking for source URL patterns, attribution phrases, or link references.

#### Scenario: Output with source links
- **WHEN** agent output presents data and includes source URL references or attribution
- **THEN** the scorer SHALL return a high score (≥0.8)

#### Scenario: Data without attribution
- **WHEN** agent output presents factual data claims without any source reference
- **THEN** the scorer SHALL penalize the score

#### Scenario: No data presented
- **WHEN** agent output is conversational without factual claims
- **THEN** the scorer SHALL return a score of 1.0 (not applicable)

---

### Requirement: Data Freshness Scorer
The system SHALL provide an LLM-based scorer that cross-references dates from tool results (lastUpdated, lastUpdate, period, year/month) against dates mentioned in the agent's Hebrew text output to detect date discrepancies.

#### Scenario: Consistent dates
- **WHEN** agent text mentions "updated January 2026" and tool results show `lastUpdated: "2026-01-15"`
- **THEN** the scorer SHALL return a score of 1.0

#### Scenario: Stale date in text
- **WHEN** tool results show `lastUpdated: "2026-01-15"` but agent text says "data from 2023"
- **THEN** the scorer SHALL penalize the score for the date discrepancy

#### Scenario: No tool dates available
- **WHEN** tool results contain no date fields
- **THEN** the scorer SHALL return a score of 1.0 (cannot verify)

#### Scenario: Tool dates present but agent omits dates
- **WHEN** tool results contain date fields but agent text mentions no dates
- **THEN** the scorer SHALL return a minor penalty (0.8) for missing date information

---

### Requirement: Live Scorer Integration
The system SHALL attach all 6 scorers as live evaluations on each agent (routing, datagov, cbs) with configurable sampling rates, running asynchronously without blocking agent responses.

#### Scenario: Critical scorer always runs
- **WHEN** the hebrew-output scorer is configured on an agent
- **THEN** it SHALL have a sampling rate of 1.0 (score every response)

#### Scenario: Non-critical scorers sample
- **WHEN** non-critical scorers (tech leakage, conciseness, tool compliance, source attribution) are configured
- **THEN** they SHALL have sampling rates between 0.3 and 0.5

#### Scenario: Scorers don't block responses
- **WHEN** live scorers execute during agent response
- **THEN** they SHALL run asynchronously and never increase response latency

---

### Requirement: Mastra Instance Scorer Registration
The system SHALL register all scorers on the Mastra instance for trace evaluation compatibility with Mastra Studio.

#### Scenario: Scorers available in Studio
- **WHEN** the Mastra instance is initialized
- **THEN** all 6 scorers SHALL be registered in the `scorers` config

---

### Requirement: CI/CD Eval Test Suites
The system SHALL provide Vitest test files using `runEvals()` to evaluate each agent against representative Hebrew test cases with scorer assertions.

#### Scenario: Routing agent eval
- **WHEN** routing agent CI tests run
- **THEN** they SHALL test delegation of data.gov.il and CBS queries with hebrew-output, no-tech-leakage, and tool-compliance scorers

#### Scenario: DataGov agent eval
- **WHEN** datagovAgent CI tests run
- **THEN** they SHALL test dataset search queries with hebrew-output, no-tech-leakage, conciseness, and source-attribution scorers

#### Scenario: CBS agent eval
- **WHEN** cbsAgent CI tests run
- **THEN** they SHALL test statistical queries with hebrew-output, no-tech-leakage, and conciseness scorers

#### Scenario: Score thresholds
- **WHEN** CI eval tests complete
- **THEN** they SHALL assert that aggregate scores meet minimum thresholds (≥0.7 for all scorers)

---

### Requirement: Low-Score Query Function
The system SHALL provide a Convex query function that retrieves low-scoring results from the `mastra_scorers` table, filtered by agent ID, score threshold, and time window.

#### Scenario: Query low scores by agent
- **WHEN** the query is called with `entityId: 'routingAgent'` and `maxScore: 0.7`
- **THEN** it SHALL return score rows where `score < 0.7` for the routing agent, ordered by creation date descending

#### Scenario: Time window filter
- **WHEN** the query is called with a `since` date parameter
- **THEN** it SHALL only return scores created after that date

#### Scenario: Pagination
- **WHEN** more than 50 low-scoring results exist
- **THEN** the query SHALL support pagination with a configurable limit

---

### Requirement: Prompt Revisions Table
The system SHALL provide a Convex table `prompt_revisions` to persist prompt optimization results for later access and review.

#### Scenario: Save revision to Convex
- **WHEN** the optimizer generates a proposed prompt revision in default mode
- **THEN** it SHALL insert a row into `prompt_revisions` with agentId, currentPrompt, proposedPrompt, scoresSummary, failureCount, model, status="proposed", and createdAt

#### Scenario: Query revisions by agent
- **WHEN** a user queries prompt revisions for a specific agent
- **THEN** the system SHALL return revisions ordered by creation date descending via the `by_agent` index

#### Scenario: Update revision status
- **WHEN** a human reviews a proposed revision
- **THEN** the system SHALL support updating the status to "accepted" or "rejected"

---

### Requirement: Prompt Optimization Script
The system SHALL provide a TypeScript script that reads low-scoring results from Convex, groups failures by agent and scorer, and uses an LLM meta-prompt to propose improved instruction prompts for each agent. The script SHALL support two output modes.

#### Scenario: Read failures from Convex
- **WHEN** the script runs for a given agent ID
- **THEN** it SHALL query the `mastra_scorers` table for scores below the configured threshold and extract `input`, `output`, `score`, and `reason` from each row

#### Scenario: Read current instruction prompt
- **WHEN** the script identifies an agent with low scores
- **THEN** it SHALL read the current instruction prompt from the agent's config file (e.g., `agents/network/routing/config.ts`)

#### Scenario: Generate improved prompt
- **WHEN** failure examples are collected and grouped by scorer
- **THEN** the script SHALL construct a meta-prompt containing: (1) the current instruction, (2) failure examples with their scores and reasons grouped by scorer type, and (3) instructions for the LLM to produce a revised prompt that addresses the failures
- **AND** the script SHALL send this meta-prompt to a strong LLM model

#### Scenario: Default output to Convex
- **WHEN** the LLM returns a revised instruction prompt and no `--local-only` flag is set
- **THEN** the script SHALL save the revision to the `prompt_revisions` Convex table with status "proposed"

#### Scenario: Local output to file
- **WHEN** the `--local` or `--local-only` flag is set
- **THEN** the script SHALL write the proposed revision to a local file at `agents/evals/proposed-prompts/<agentId>-<date>.md`

#### Scenario: Combined output
- **WHEN** the `--local` flag is set (without `--local-only`)
- **THEN** the script SHALL save to BOTH Convex and local file

#### Scenario: No failures found
- **WHEN** no low-scoring results exist for the specified agent
- **THEN** the script SHALL report that no optimization is needed and exit without generating a proposal

---

### Requirement: CI/CD Pipeline
The system SHALL provide a GitHub Actions workflow that runs type checking, build, lint, and tests on every PR and push to main.

#### Scenario: PR validation
- **WHEN** a pull request is opened against any branch
- **THEN** the CI SHALL run `tsc`, `pnpm build`, `pnpm lint`, and `pnpm test` (excluding eval tests that require API keys)

#### Scenario: Push to main validation
- **WHEN** code is pushed to main
- **THEN** the CI SHALL run the same build/lint/test checks as PR validation

#### Scenario: Eval tests on PR and main
- **WHEN** a PR is opened or code is pushed to main and the `OPENROUTER_API_KEY` secret is configured
- **THEN** the CI SHALL run eval tests (`agents/evals/__tests__/`) with the OpenRouter API key

---

### Requirement: npm Scripts
The system SHALL provide convenience npm scripts for running evals and prompt optimization.

#### Scenario: Individual agent eval scripts
- **WHEN** a developer runs `npm run eval:routing`, `eval:datagov`, or `eval:cbs`
- **THEN** it SHALL run the corresponding agent's eval test file

#### Scenario: All evals script
- **WHEN** a developer runs `npm run eval:all`
- **THEN** it SHALL run all eval test files

#### Scenario: Optimize prompts script
- **WHEN** a developer runs `npm run optimize-prompts -- <agentId>`
- **THEN** it SHALL execute the prompt optimization script for the specified agent
