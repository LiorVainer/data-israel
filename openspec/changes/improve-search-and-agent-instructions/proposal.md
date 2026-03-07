# Change: Improve dataset search quality and agent instructions

## Why

The dataset search tool (`searchDatasets`) relied solely on Convex RAG semantic search, which produced poor results for Hebrew queries:
- Long phrases like "נתוני דיוק רכבת ישראל" returned completely irrelevant results ("מאגר אילנות רחוב")
- GIS datasets with keyword-stuffed tags dominated embeddings, pushing operational datasets down
- CKAN API fallback only triggered when RAG returned 0 results — but RAG always returned *something* (just wrong)
- Sub-agent instructions lacked search strategy guidance, causing models to use overly specific queries

Additionally, the suggested prompt cards in `EmptyConversation.tsx` and `prompts.ts` referenced datasets that were hard to answer (e.g., socio-economic rankings, EV statistics) while fresh, queryable datasets (trains, flights, air quality) went unused.

## What Changes

### Search Tool Architecture
- **Parallel RAG + CKAN search**: Both sources run simultaneously via `Promise.allSettled`, results merged and deduplicated by dataset ID
- **RAG score threshold**: Results below 0.5 score filtered out (garbage elimination)
- **CKAN-first ranking**: CKAN results appear first in merged list (better keyword matching for Hebrew)
- Same pattern applied to `searchResources` tool

### RAG Indexing Quality
- **Tag deduplication**: `[...new Set(tags)]` prevents repeated tags from inflating embeddings
- **Tag cap**: Max 5 unique tags per dataset to prevent keyword-stuffing
- Applied to both `indexDataset` and `batchIndexDatasets` in `convex/search.ts`

### Agent Instructions
- **DataGov agent**: Added explicit search strategy — use 1-2 short keywords, try 2-3 different queries before reporting "not found"
- **CBS agent**: Added catalog drilling strategy — must navigate through levels 1-4, not stop at level 1
- **Routing agent**: Added unified response rule — no duplicate paragraphs when multiple agents report no results
- **Tool descriptions**: Updated Zod schema descriptions to explicitly request short keyword queries with examples

### Prompt Suggestions
- Replaced 4 prompts with 8 data-verified prompts covering: CPI, trains, construction, housing prices, flights, road accidents, foreign trade, air quality
- Updated `EmptyConversation.tsx` cards with matching icons
- All prompts verified against live API data (data.gov.il + CBS)

### Model Configuration
- Updated default model assignments: routing → `x-ai/grok-4.1-fast`, sub-agents → `google/gemini-2.5-flash-lite` (configurable via env vars and Convex `ai_models` table)
- Updated `.env.example` and `lib/env.ts` defaults

## Impact
- Affected specs: `agent-tools`
- Affected code:
  - `lib/tools/datagov/search-datasets.ts` — parallel search, score threshold
  - `lib/tools/datagov/search-resources.ts` — same parallel pattern
  - `convex/search.ts` — tag dedup + cap in indexing
  - `agents/network/datagov/config.ts` — search strategy instructions
  - `agents/network/cbs/config.ts` — catalog drilling instructions
  - `agents/network/routing/config.ts` — unified response rule
  - `constants/prompts.ts` — 8 new data-verified prompts
  - `components/chat/EmptyConversation.tsx` — 8 prompt cards with icons
  - `agents/evals/__tests__/routing-agent.eval.ts` — eval inputs from new prompts
  - `agents/agent.config.ts` — model pricing info
  - `lib/env.ts` — new model defaults
  - `.env.example` — updated defaults
