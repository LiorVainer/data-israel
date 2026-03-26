# Tasks: Add Source-Based Suggestions to Empty Conversation

## Phase 1: Type Definitions & Registry

### 1.1 Add Suggestion Types
- [x] Add `SuggestionPrompt` interface to `src/data-sources/types/display.types.ts` (label, prompt, icon)
- [x] Add `SuggestionsConfig` interface to `display.types.ts` (icon?, color?, prompts[])
- [x] Export both from `types/index.ts`
- [x] Add optional `suggestions?: SuggestionsConfig` to `DataSourceDefinition` in `data-source.types.ts`
- [x] Run `tsc` to verify

### 1.2 Add Suggestions to Registry
- [x] Add `suggestions` field to `DataSourceMeta` interface in `registry.ts`
- [x] Add `getDataSourcesWithSuggestions()` function to registry
- [x] Export from registry
- [x] Run `tsc` to verify

## Phase 2: Add Suggestions to All 8 Sources

### 2.1 Add Suggestions Config to Each Source (in registry.ts meta entries)
- [x] **data.gov.il** — 2-3 prompts about open data datasets, organizations, resources
- [x] **CBS** — 2-3 prompts about CPI, statistics, price indices, population
- [x] **BudgetKey** — 2-3 prompts about state budget, contracts, tenders, support programs
- [x] **Knesset** — 2-3 prompts about bills, committees, Knesset members
- [x] **Nadlan** — 2-3 prompts about apartment prices, real estate trends, neighborhoods
- [x] **Drugs** — 2-3 prompts about medications, generic alternatives, health basket
- [x] **Health** — 2-3 prompts about hospital quality, HMO data, child health
- [x] **Grocery** — 2-3 prompts about supermarket prices, chain comparison, promotions
- [x] Run `tsc` to verify

## Phase 3: Refactor EmptyConversation Component

### 3.1 Refactor EmptyConversation with Category Tabs
- [x] Import `getDataSourcesWithSuggestions` and `LANDING_CATEGORIES` from registry/types
- [x] Replace `PROMPT_CARDS` grid with shadcn `Tabs` by `LANDING_CATEGORIES` (same 3 tabs as landing page)
- [x] Within each tab, show suggestion cards from all sources in that category
- [x] Each card shows a small source badge (icon + name) so user knows which agent handles it
- [x] Default: first category tab (government) selected
- [x] Keep the existing card styling (rounded-xl, border, icon, label, prompt text)
- [x] Keep the AiDisclaimer at bottom
- [x] Keep RTL support (`dir="rtl"`)
- [x] Responsive: 1 col mobile, 2 tablet, 4 desktop (match current grid)

### 3.3 Remove Old Prompt Cards
- [x] Delete `src/constants/prompt-cards.ts`
- [x] Remove any imports of `PROMPT_CARDS` from other files
- [x] Run `tsc` and `npm run build` to verify

## Phase 4: Documentation
- [x] Update `CLAUDE.md` — mention suggestions config on DataSourceDefinition
- [x] Update `src/data-sources/CLAUDE.md` — add suggestions section to "Adding a New Data Source"
- [x] Run `tsc`

## Dependency Graph

```
Phase 1 (types) → Phase 2 (configs) → Phase 3 (UI refactor) → Phase 4 (docs)
```
