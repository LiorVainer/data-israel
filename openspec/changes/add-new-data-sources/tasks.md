# Tasks: Add New Data Sources

> **Research guidance:** Before implementing each data source, explore the reference MCP server code using the **octocode MCP** tools (githubViewRepoStructure, githubGetFileContent, githubSearchCode) and the **https://agentskills.co.il/en/mcp#servers** directory for API documentation, tool schemas, and implementation patterns.

## Phase 0: Cleanup & Foundation (unblocks all phases)

### 0.1 Simplify ToolTranslation Interface
- [x] Remove `formatInput` and `formatOutput` from `ToolTranslation` in `src/data-sources/types/tool.types.ts`
- [x] Update `datagov.translations.tsx` — remove all formatting functions and helpers, keep only `name` + `icon` per tool
- [x] Update `cbs.translations.tsx` — remove all formatting functions and helpers, keep only `name` + `icon` per tool
- [x] Update `src/lib/tools/client/translations.tsx` — same cleanup
- [x] Run `tsc` to verify no compile errors from interface change

### 0.2 Dead Code Removal & Relocate `getToolInfo`
- [x] Move `getToolInfo()` from `MessageToolCalls.tsx` to `src/lib/utils/tool-info.ts` (it's a utility, not a component)
- [x] Update all imports of `getToolInfo` (`AgentInternalCallsChain.tsx`, `ToolCallParts.tsx`, `ToolCallStep.tsx`) to import from `@/lib/utils/tool-info`
- [x] Delete `src/components/chat/MessageToolCalls.tsx` entirely (all remaining code is dead: `MessageToolCalls` component, `getToolDescription`, `getToolIO`, `ToolIO`)
- [x] Delete `src/components/chat/ToolCallCard.tsx` entirely
- [x] Update `src/components/chat/index.ts` — remove `getToolDescription`, `getToolIO`, `getToolInfo` exports (re-export `getToolInfo` from new location if needed)
- [x] Run `npm run build && npm run lint` to verify nothing breaks

### 0.3 Add Per-Source Resource Extractors
- [x] Add `resourceExtractors` field to `DataSourceDefinition` in `data-source.types.ts`
- [x] Migrate `extractToolResource()` logic from `ToolCallParts.tsx` into per-source extractors on `datagov` and `cbs` definitions
- [x] Update `ToolCallParts.tsx` to look up extractors from registry, fall back to generic
- [x] Update `AgentInternalCallsChain.tsx` to use registry extractors for chip labels
- [x] Run contract tests for existing data sources

### 0.4 Add Landing Config to DataSourceDefinition
- [x] Define `LANDING_CATEGORIES` constant in `src/data-sources/types/display.types.ts`
- [x] Add `LandingCategory` type as `keyof typeof LANDING_CATEGORIES`
- [x] Add optional `landing` field to `DataSourceDefinition` interface
- [x] Add `landing` config to existing `datagov` and `cbs` data source definitions
- [x] Run `tsc` to verify

### 0.5 Install @mastra/mcp
- [x] Run `pnpm add @mastra/mcp`
- [x] Verify import `MCPClient` from `@mastra/mcp` compiles

---

## Phase 1: BudgetKey via MCPClient

> **Reference:** Explore `OpenBudget/budgetkey-mcp` on GitHub via octocode. Hosted MCP at `https://next.obudget.org/mcp`. See https://agentskills.co.il/en/mcp/budgetkey

### 1.1 Create Budget Data Source Module
- [x] Create `src/data-sources/budget/` folder structure
- [x] Create `budget.mcp.ts` — `MCPClient` instance with `url: https://next.obudget.org/mcp`
- [x] Create `budget.agent.ts` — agent factory using `await budgetMcpClient.listTools()`
- [x] Create `budget.translations.tsx` — Hebrew names + icons for `budgetkey_DatasetInfo`, `budgetkey_DatasetFullTextSearch`, `budgetkey_DatasetDBQuery`
- [x] Create `budget.display.ts` — badge config + agent display info
- [x] Create `budget/index.ts` — export `BudgetDataSource` satisfying `DataSourceDefinition`
- [x] Add `resourceExtractors` for BudgetKey tools (extract `dataset`, `q` fields)
- [x] Add `landing` config (category: `government`)

### 1.2 Register, Test & Verify
- [x] Register `BudgetDataSource` in `src/data-sources/registry.ts`
- [x] Update `DataSource` union type to include `'budget'`
- [x] Add CSS variables for budget badge styling in `globals.css`
- [x] Write contract tests `budget/__tests__/budget-data-source.test.ts` following `src/data-sources/CLAUDE.md` contract test template (satisfies interface, translation keys in tools, resolver keys in tools, agent factory ID, resolvers return null on failure)
- [x] Run `npm run build && npm run lint`
- [x] Test budget agent via dev server — verify tool calls stream correctly in UI

---

## Phase 2: Knesset Data Source

> **Reference:** Explore `zohar/knesset-mcp` on GitHub via octocode. OData API at `http://knesset.gov.il/Odata/ParliamentInfo.svc`. See https://agentskills.co.il/en/mcp/knesset-mcp

### 2.1 Create Knesset API Client
- [x] Create `src/data-sources/knesset/api/knesset.endpoints.ts` — OData base URL, path builders
- [x] Create `src/data-sources/knesset/api/knesset.types.ts` — OData response types (Bill, Committee, Member)
- [x] Create `src/data-sources/knesset/api/knesset.client.ts` — Axios client with OData query helpers ($filter, $expand, $top, $orderby)

### 2.2 Create Knesset Tools
- [x] Create `searchBills.tool.ts` — search bills by keyword + optional Knesset number
- [x] Create `getBillInfo.tool.ts` — get bill details by ID including initiators
- [x] Create `getCommitteeInfo.tool.ts` — get committee details
- [x] Create `listCommittees.tool.ts` — list committees by Knesset number
- [x] Create `getKnessetMembers.tool.ts` — list members by Knesset number
- [x] Create `getCurrentKnesset.tool.ts` — get current Knesset number
- [x] Create `knesset/tools/index.ts` — export `KnessetTools` object

### 2.3 Wire, Test & Verify
- [x] Create `knesset.agent.ts` with Hebrew system prompt
- [x] Create `knesset.translations.tsx` (name + icon per tool)
- [x] Create `knesset.display.ts` (badge config)
- [x] Create `knesset/index.ts` — export `KnessetDataSource`
- [x] Add `resourceExtractors` and `landing` config (category: `government`)
- [x] Register in registry, update `DataSource` union, add badge CSS variables
- [x] Write contract tests `knesset/__tests__/knesset-data-source.test.ts` (satisfies interface, translation keys, resolver keys, agent factory ID, resolvers null on failure)
- [x] Run `npm run build && npm run lint`

---

## Phase 3: Nadlan Data Source

> **Reference:** Explore `nitzpo/nadlan-mcp` on GitHub via octocode. Govmap API at `https://www.govmap.gov.il/api/`. See https://agentskills.co.il/en/mcp/nadlan-mcp

### 3.1 Create Nadlan API Client
- [x] Create `src/data-sources/nadlan/api/nadlan.endpoints.ts` — Govmap base URL, path builders
- [x] Create `src/data-sources/nadlan/api/nadlan.types.ts` — response types (Deal, Address, Polygon)
- [x] Create `src/data-sources/nadlan/api/nadlan.client.ts` — Axios client with rate limiting (5 req/s)

### 3.2 Create Nadlan Tools
- [x] Create `autocompleteAddress.tool.ts`
- [x] Create `findRecentDeals.tool.ts` — main tool: deals near an address
- [x] Create `getStreetDeals.tool.ts`
- [x] Create `getNeighborhoodDeals.tool.ts`
- [x] Create `getValuationComparables.tool.ts`
- [x] Create `getMarketActivityMetrics.tool.ts`
- [x] Create `getDealStatistics.tool.ts`
- [x] Create `nadlan/tools/index.ts`

### 3.3 Wire, Test & Verify
- [x] Create agent, translations, display, index, resource extractors, landing config (category: `economy`)
- [x] Register in registry, update `DataSource` union, add badge CSS
- [x] Write contract tests `nadlan/__tests__/nadlan-data-source.test.ts` (satisfies interface, translation keys, resolver keys, agent factory ID, resolvers null on failure)
- [x] Run `npm run build && npm run lint`

---

## Phase 4: Health Agent (Drugs + IL Health)

### 4.1 Create Israel Drugs API Client & Tools

> **Reference:** Explore `DavidOsherDevDev/israel-drugs-mcp-server` on GitHub via octocode. API at `https://israeldrugs.health.gov.il/GovServiceList/IDRServer`. See https://agentskills.co.il/en/mcp/israel-drugs

- [x] Create `src/data-sources/drugs/api/` — REST client for `israeldrugs.health.gov.il`
- [x] Create tools: `searchDrugByName`, `searchDrugBySymptom`, `exploreGenericAlternatives`, `exploreTherapeuticCategories`, `browseSymptoms`, `getDrugDetails`, `listAdministrationRoutes`, `suggestDrugNames`
- [x] Create agent, translations, display, index
- [x] Add resource extractors and landing config (category: `health`)
- [x] Register, update union, add CSS
- [x] Write contract tests `drugs/__tests__/drugs-data-source.test.ts` (satisfies interface, translation keys, resolver keys, agent factory ID, resolvers null on failure)

### 4.2 Create IL Health API Client & Tools

> **Reference:** Explore `david-aftergut/ILHealth-mcp` on GitHub via octocode. API at `https://datadashboard.health.gov.il/api`. See https://agentskills.co.il/en/mcp/il-health

- [x] Create `src/data-sources/health/api/` — REST client for `datadashboard.health.gov.il`
- [x] Create tools: `getAvailableSubjects`, `getMetadata`, `getData`, `getLinks`
- [x] Create agent, translations, display, index
- [x] Add resource extractors and landing config (category: `health`)
- [x] Register, update union, add CSS
- [x] Write contract tests `health/__tests__/health-data-source.test.ts` (satisfies interface, translation keys, resolver keys, agent factory ID, resolvers null on failure)

### 4.3 Verify Health Phase
- [x] Run `npm run build && npm run lint`

---

## Phase 5: Grocery Prices Data Source

> **Reference:** Explore the installed skill at `.agents/skills/israeli-grocery-price-intelligence/` for chain feed URLs, XML schemas, and parsing logic. Reference script: `scripts/parse_price_xml.py`. See https://agentskills.co.il/en/skills/food-and-dining/israeli-grocery-price-intelligence

### 5.1 Create Grocery Price Feed Client
- [x] Create `src/data-sources/grocery/api/grocery.endpoints.ts` — chain feed URLs (from `references/chain-feeds.md`)
- [x] Create `src/data-sources/grocery/api/grocery.types.ts` — XML item/store types
- [x] Create `src/data-sources/grocery/api/grocery.client.ts` — fetch + parse gzipped XML feeds
- [x] Create `src/data-sources/grocery/api/grocery.parser.ts` — XML to normalized JSON (port from `parse_price_xml.py`)

### 5.2 Create Grocery Tools
- [x] Create `searchProductPrice.tool.ts` — search by barcode or name across chains
- [x] Create `compareAcrossChains.tool.ts` — price comparison table
- [x] Create `getChainStores.tool.ts` — list stores for a chain
- [x] Create `getActivePromotions.tool.ts` — current promotions for a product
- [x] Create `grocery/tools/index.ts`

### 5.3 Wire, Test & Verify
- [x] Create agent, translations, display, index
- [x] Add resource extractors and landing config (category: `economy`)
- [x] Register, update union, add CSS
- [x] Write contract tests `grocery/__tests__/grocery-data-source.test.ts` (satisfies interface, translation keys, resolver keys, agent factory ID, resolvers null on failure)
- [x] Run `npm run build && npm run lint`

---

## Phase 6: Landing Page Refactor

### 6.1 Create SourceCard Component
- [x] Create `src/components/landing/SourceCard.tsx` — renders logo, description, stats, link
- [x] Style with Tailwind (dark mode, RTL-aware)

### 6.2 Refactor SourcesSection
- [x] Import `LANDING_CATEGORIES` and data source configs from registry
- [x] Replace hardcoded SourceBlocks with shadcn `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`
- [x] Within each tab, render `SourceCard` grid (1/2/3 cols responsive)
- [x] Ensure RTL support (`dir="rtl"` on Tabs)
- [x] Remove old SourceBlock sub-components
- [x] Run `npm run build && npm run lint`
- [x] Visual test in browser

---

## Phase 7: Documentation Updates

### 7.1 Update Project Documentation
- [x] Update `README.md` — add new data sources to overview, update architecture diagram, update agent table
- [x] Update `CLAUDE.md` (project root) — update Architecture section, Agent Network Flow, project structure, add new sources to DataSources list, update DataSource union reference, update agent count and tool counts
- [x] Update `src/data-sources/CLAUDE.md` — add notes about MCPClient pattern (budget example), `landing` config, `resourceExtractors`, simplified `ToolTranslation` (name + icon only, no formatInput/formatOutput), contract test template for MCPClient sources
- [x] Run `npm run build && npm run lint && npm run vibecheck`

---

## Dependency Graph

```
Phase 0 (cleanup) ──┬──> Phase 1 (BudgetKey)
                     ├──> Phase 2 (Knesset)
                     ├──> Phase 3 (Nadlan)
                     ├──> Phase 4 (Health)
                     ├──> Phase 5 (Grocery)
                     └──> Phase 6 (Landing) ──> Phase 7 (Docs)
```

Phases 1-5 can be parallelized after Phase 0. Phase 6 depends on at least some sources existing. Phase 7 is last.
