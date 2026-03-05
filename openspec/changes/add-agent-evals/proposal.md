# Change: Add Mastra eval scorers for agent network quality monitoring

## Why
The agent network (routing, datagov, cbs) has no automated quality evaluation. Agent outputs can regress — wrong language, technical leakage, missing source URLs, incorrect tool ordering — with no detection mechanism. Mastra's built-in scorer system provides both live (production) and CI/CD evaluation capabilities.

## What Changes
- Install `@mastra/evals` package
- Create 6 custom scorers (`type: 'agent'`) evaluating Hebrew output, technical leakage, tool compliance, conciseness, source attribution, and data freshness
- Attach all 6 scorers as **live scorers** on each agent with sampling control
- Register all scorers on the Mastra instance for trace evaluation in Studio
- Add CI/CD eval test suites (`runEvals`) for each agent with representative test cases
- Create shared eval config (judge model, sampling rates)
- **Prompt optimization script** with combinable output modes:
  - **Convex mode (default):** Saves proposed prompt revisions to a `prompt_revisions` Convex table for later access/review
  - **`--local` flag:** Also writes to local file at `agents/evals/proposed-prompts/`
  - **`--local-only` flag:** Writes to local file only, skips Convex
  - Both `--local` and default Convex can run together
- **npm scripts** for easy running: `eval:routing`, `eval:datagov`, `eval:cbs`, `eval:all`, `optimize-prompts`
- **GitHub Actions CI/CD workflow** to run tests on every PR and push to main

## Impact
- Affected specs: new `agent-evals` capability
- Affected code:
  - `agents/evals/` (new directory — scorers, tests, config, optimizer)
  - `agents/network/routing/routing.agent.ts` (add `scorers` config)
  - `agents/network/datagov/data-gov.agent.ts` (add `scorers` config)
  - `agents/network/cbs/cbs.agent.ts` (add `scorers` config)
  - `agents/mastra.ts` (register scorers for trace eval)
  - `scripts/optimize-prompts.ts` (new — prompt optimization script)
  - `convex/scores.ts` (new — Convex queries for low-scoring results)
  - `convex/promptRevisions.ts` (new — Convex table + mutations for prompt revisions)
  - `convex/schema.ts` (add `prompt_revisions` table)
  - `.github/workflows/ci.yml` (new — CI/CD pipeline)
- New dependency: `@mastra/evals`
