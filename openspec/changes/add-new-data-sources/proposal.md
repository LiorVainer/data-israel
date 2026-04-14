# Proposal: Add New Data Sources

## Change ID
`add-new-data-sources`

## Summary
Expand the Israeli Open Data AI Agent from 2 data sources (data.gov.il, CBS) to 8 by integrating 6 new Israeli government and public data sources. Includes a config-driven landing page refactor with grouped tabs, simplification of the `ToolTranslation` interface (dead code removal), and per-source resource extractors.

## Motivation
The project currently covers only data.gov.il datasets and CBS statistics. Users frequently ask about government budgets, real estate prices, Knesset legislation, health data, and grocery prices — all of which are available via public Israeli APIs but not integrated. Adding these sources transforms the project from an "open data search tool" into a comprehensive **Israeli government transparency platform**.

## Prerequisites
- `unify-data-source-architecture` change must be completed (currently 64/70 tasks). The new sources rely on the `DataSourceDefinition<TTools>` pattern, registry auto-wiring, and self-contained source folders.

## Scope

### In scope
- 6 new data source integrations (BudgetKey, Knesset, Nadlan, Israel Drugs, IL Health, Grocery Prices)
- MCPClient integration for hosted MCP endpoints (BudgetKey)
- Config-driven landing page with category-grouped Tabs + cards
- `LANDING_CATEGORIES` as typed single source of truth
- Simplify `ToolTranslation` — remove dead `formatInput`/`formatOutput`
- Per-source `extractResource` on `DataSourceDefinition`
- Dead code removal (`MessageToolCalls` component, `ToolCallCard`, `getToolDescription`, `getToolIO`)
- Update README.md and both CLAUDE.md files

### Out of scope
- NLI (National Library of Israel) — future cultural heritage agent
- Remy (Land Authority tenders) — future expansion alongside Nadlan
- Sefaria (Jewish texts) — different domain
- Changes to the routing agent's core delegation mechanism
- UI component redesign beyond SourcesSection

## New Data Sources

### 1. BudgetKey — Government Budget & Spending
- **API**: `https://next.obudget.org` (REST + SQL)
- **MCP**: Hosted at `https://next.obudget.org/mcp` — connect via Mastra `MCPClient`
- **Tools**: 3 (DatasetInfo, DatasetFullTextSearch, DatasetDBQuery)
- **Data**: State budget 1997-2025, procurement contracts, tenders, support programs, government entities, state revenues, budget change requests (8 datasets)
- **Integration**: MCPClient with `url` transport — zero custom API code

### 2. Knesset — Parliamentary Data
- **API**: `http://knesset.gov.il/Odata/ParliamentInfo.svc` (OData)
- **Tools**: ~6 (search bills, get bill info, get committee info, list committees, get members, get current Knesset number)
- **Data**: Bills (private/government/committee), committees + sessions, Knesset members, legislative process
- **Integration**: Custom Mastra tools with OData client

### 3. Nadlan — Real Estate Transactions
- **API**: `https://www.govmap.gov.il/api/` (REST)
- **Tools**: ~8 (address autocomplete, deals by radius/street/neighborhood, market trends, valuation comparables, market activity metrics)
- **Data**: Completed real estate transactions, prices/sqm, property types, rooms, floors, neighborhoods
- **Integration**: Custom Mastra tools with REST client

### 4. Israel Drugs — Pharmaceutical Database
- **API**: `https://israeldrugs.health.gov.il/GovServiceList/IDRServer` (REST)
- **Tools**: ~8 (drug search by name/symptom, generic alternatives, therapeutic categories, health fund coverage)
- **Data**: 1,172 ATC categories, health basket status per HMO, OTC vs prescription, multi-language
- **Integration**: Custom Mastra tools with REST client
- **Note**: CC-BY-NC-SA license — verify compatibility

### 5. IL Health — Ministry of Health Dashboards
- **API**: `https://datadashboard.health.gov.il/api` (REST)
- **Tools**: ~4 (get subjects, get metadata, get data, get links)
- **Data**: 7 subjects — HMO insurance, service quality, child development, child checkups, medical services, beaches, war casualties
- **Integration**: Custom Mastra tools with REST client

### 6. Grocery Prices — Supermarket Price Transparency
- **API**: XML feeds from 7+ chains (Shufersal, Rami Levy, Yochananof, Victory, Osher Ad, Tiv Taam)
- **Tools**: ~5 (search product price, compare across chains, optimize shopping list)
- **Data**: Daily price feeds (PricesFull, PricesPromotions, Stores) under Price Transparency Law 2015
- **Integration**: Custom Mastra tools with XML feed parser + REST client
- **Complexity**: Highest — XML parsing, cross-chain matching by barcode, store-specific pricing

## Key Design Decisions

### 1. Flat routing with parallel sub-agent calls
Keep the routing agent delegating directly to all sub-agents (no hierarchy). Mastra supports parallel sub-agent calls for cross-domain queries (e.g., budget + real estate).

### 2. MCPClient for hosted endpoints
Use Mastra's `MCPClient` with `url` transport for BudgetKey (`https://next.obudget.org/mcp`). Tools are auto-discovered and namespaced as `budgetkey_ToolName`. All other sources are stdio-only and require custom Mastra tools.

### 3. Config-driven landing page with category Tabs
Replace hardcoded `SourcesSection` with Tabs by category, cards in a grid per tab. Categories defined once in a typed constant (`LANDING_CATEGORIES`), each `DataSourceDefinition` declares its `landing.category` as `keyof typeof LANDING_CATEGORIES`.

### 4. Simplified ToolTranslation
Remove dead `formatInput`/`formatOutput` from `ToolTranslation` interface. Only `name` + `icon` are used by the rendering pipeline. Add per-source `extractResource` function on `DataSourceDefinition` for chip labels in `AgentInternalCallsChain`.

### 5. Per-source resource extractors
Move `extractToolResource()` from a single hardcoded function to per-source extractors declared in `DataSourceDefinition`. Each source knows how to extract display labels from its own tool args/results. The generic function becomes a fallback.
