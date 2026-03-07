## 1. Search Tool Improvements
- [x] 1.1 Refactor `searchDatasets` to run RAG + CKAN in parallel via `Promise.allSettled`
- [x] 1.2 Add RAG score threshold (0.5 minimum) to filter low-quality results
- [x] 1.3 Merge results with CKAN-first ranking, deduplicate by dataset ID
- [x] 1.4 Apply same parallel pattern to `searchResources`
- [x] 1.5 Update tool descriptions and Zod schema to guide short keyword queries

## 2. RAG Indexing Quality
- [x] 2.1 Deduplicate tags with `new Set()` in `indexDataset` handler
- [x] 2.2 Cap tags at 5 per dataset to prevent keyword-stuffing
- [x] 2.3 Apply same fix to `batchIndexDatasets` handler
- [x] 2.4 Re-sync datasets to re-embed with cleaned text (`npx tsx scripts/sync-to-convex.ts`)

## 3. Agent Instruction Improvements
- [x] 3.1 Add search strategy section to DataGov agent — short keywords, 2-3 retries
- [x] 3.2 Add catalog drilling strategy to CBS agent — navigate levels 1-4
- [x] 3.3 Add unified response rule to routing agent — no duplicate paragraphs

## 4. Prompt Suggestions
- [x] 4.1 Research live API data to identify fresh, queryable datasets
- [x] 4.2 Replace 4 prompts with 8 data-verified prompts in `constants/prompts.ts`
- [x] 4.3 Update `EmptyConversation.tsx` with 8 cards and matching icons
- [x] 4.4 Update routing agent eval inputs to use new prompts

## 5. Model Configuration
- [x] 5.1 Update `lib/env.ts` defaults for per-agent model IDs
- [x] 5.2 Update `.env.example` with new defaults
- [x] 5.3 Add pricing info to `AVAILABLE_MODELS` in `agent.config.ts`
