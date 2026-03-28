# Proposal: Split Grocery into Separate Chain Data Sources

## Change ID
`split-grocery-into-chain-sources`

## Summary
Replace the generic `grocery` data source (broken XML feeds) with two dedicated chain data sources — `shufersal` and `rami-levy` — each using the chain's own REST API for product search and price data. Both APIs are publicly accessible without authentication and return rich product data.

## Motivation
The current grocery data source relies on XML price feeds that are mostly broken:
- Only Shufersal and Victory XML feeds are accessible (4 of 6 chains are DNS-dead)
- The XML feed approach requires downloading large gzipped files and parsing them
- Both Shufersal and Rami Levy have modern REST APIs that return product data instantly

Making each chain its own data source with a dedicated agent follows the project's architecture pattern — each source is self-contained with its own API client, tools, translations, and display config.

## Scope

### In scope
- New `shufersal` data source with REST API client
- New `rami-levy` data source with REST API client
- Remove old `grocery` data source (XML feed approach)
- Update registry, DataSource union, landing page, suggestions
- Update CLAUDE.md and docs

### Out of scope
- Other chains (Victory, Yochananof, Osher Ad, Tiv Taam) — can be added later if APIs are found
- Shopping cart / purchase features (Rami Levy and Shufersal MCP servers support cart, but our agents are read-only)
- `fast-xml-parser` dependency removal (can be cleaned up separately)

## APIs (verified working)

### Shufersal
- **Endpoint**: `GET https://www.shufersal.co.il/online/he/search/results?q={query}&limit=15`
- **Headers**: `accept: application/json`, `x-requested-with: XMLHttpRequest`
- **Response**: `{ results: [{ code, name, price: { value }, manufacturer, unitDescription, brandName, secondLevelCategory, images, sellingMethod }] }`
- **Auth**: None required

### Rami Levy
- **Endpoint**: `POST https://www.rami-levy.co.il/api/catalog`
- **Headers**: `Content-Type: application/json;charset=UTF-8`, `locale: he`
- **Body**: `{ q: "חלב", store: "331", aggs: 1 }`
- **Response**: `{ status, total, data: [{ id, name, barcode, price: { price }, gs: { BrandName, Net_Content }, department, group, images, prop: { sw_shakil, by_kilo } }] }`
- **Auth**: None required for search

## Key Design Decisions

### 1. Each chain = own DataSourceDefinition
Same pattern as all other sources. Each gets: `api/`, `tools/`, agent, translations, display, index.

### 2. Simpler tools (2-3 per chain)
- `searchProducts` — search by name/barcode, return prices
- `compareProducts` — search same query in both chains for comparison (on routing agent level, not per-source)
- `getProductDetails` — detailed product info (if available)

### 3. Landing page update
Replace the single "מחירי מזון" card under "economy" with two cards: "שופרסל" and "רמי לוי".

### 4. Cross-chain comparison
The routing agent can call both `shufersalAgent` and `ramiLevyAgent` in parallel for price comparison queries. No dedicated comparison tool needed — the agent handles orchestration.
