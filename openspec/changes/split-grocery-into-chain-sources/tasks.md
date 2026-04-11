# Tasks: Split Grocery into Separate Chain Data Sources

> **Reference:** Explore `shilomagen/rami-levy-mcp` and `matipojo/shufersal-mcp` on GitHub via octocode for API details.

## Phase 1: Create Shufersal Data Source

### 1.1 API Client
- [ ] Create `src/data-sources/shufersal/api/shufersal.endpoints.ts` — search URL, product URL builder
- [ ] Create `src/data-sources/shufersal/api/shufersal.types.ts` — SearchResultItem, SearchApiResponse types
- [ ] Create `src/data-sources/shufersal/api/shufersal.client.ts` — GET with `x-requested-with: XMLHttpRequest` header, retry logic

### 1.2 Tools
- [ ] Create `searchShufersalProducts.tool.ts` — search by name or barcode, return price, brand, unit, category
- [ ] Create `generateShufersalSourceUrl.tool.ts` — portal URL for `shufersal.co.il/online/he/search/results?q=...`
- [ ] Create `shufersal/tools/index.ts`

### 1.3 Agent & Config
- [ ] Create `shufersal.agent.ts` — id: 'shufersalAgent', name: 'סוכן שופרסל', Hebrew instructions about product search and prices
- [ ] Create `shufersal.translations.tsx` — name + icon per tool
- [ ] Create `shufersal.display.ts` — nameLabel: 'שופרסל', icon: ShoppingCartIcon, badge CSS
- [ ] Create `shufersal/index.ts` — DataSourceDefinition with landing (economy, order 3), suggestions, resourceExtractors, routingHint

### 1.4 Register & Test
- [ ] Register in `registry.ts` with landing + suggestions configs
- [ ] Add 'shufersal' to DataSource union in `display.types.ts`
- [ ] Add model config in `agent.config.ts`, `model.ts`, `env.ts`
- [ ] Add to `SourcesPart.tsx`
- [ ] Add badge CSS variables in `globals.css`
- [ ] Write contract tests
- [ ] Run `tsc` and `vitest`

---

## Phase 2: Create Rami Levy Data Source

### 2.1 API Client
- [ ] Create `src/data-sources/rami-levy/api/rami-levy.endpoints.ts` — catalog URL, store IDs
- [ ] Create `src/data-sources/rami-levy/api/rami-levy.types.ts` — CatalogItem, CatalogResponse types
- [ ] Create `src/data-sources/rami-levy/api/rami-levy.client.ts` — POST with JSON body, retry logic

### 2.2 Tools
- [ ] Create `searchRamiLevyProducts.tool.ts` — search by name or barcode, return price, brand, department
- [ ] Create `generateRamiLevySourceUrl.tool.ts` — portal URL
- [ ] Create `rami-levy/tools/index.ts`

### 2.3 Agent & Config
- [ ] Create `rami-levy.agent.ts` — id: 'ramiLevyAgent', name: 'סוכן רמי לוי', Hebrew instructions
- [ ] Create `rami-levy.translations.tsx`
- [ ] Create `rami-levy.display.ts` — nameLabel: 'רמי לוי', icon: ShoppingCartIcon
- [ ] Create `rami-levy/index.ts` — DataSourceDefinition with landing (economy, order 4), suggestions, resourceExtractors, routingHint

### 2.4 Register & Test
- [ ] Register in `registry.ts` with landing + suggestions configs
- [ ] Add 'rami-levy' to DataSource union
- [ ] Add model config, SourcesPart, CSS variables
- [ ] Write contract tests
- [ ] Run `tsc` and `vitest`

---

## Phase 3: Remove Old Grocery Source

### 3.1 Cleanup
- [ ] Remove `src/data-sources/grocery/` directory entirely
- [ ] Remove 'grocery' from DataSource union in `display.types.ts`
- [ ] Remove grocery entries from `registry.ts` (meta, tools, translations, suggestions, landing)
- [ ] Remove grocery from `registry.server.ts`
- [ ] Remove grocery from `model.ts`, `agent.config.ts`, `env.ts`
- [ ] Remove grocery from `SourcesPart.tsx`
- [ ] Remove grocery CSS variables from `globals.css`
- [ ] Consider removing `fast-xml-parser` from `package.json` if no other code uses it
- [ ] Run `tsc` and `vitest`

---

## Phase 4: Documentation
- [ ] Update `CLAUDE.md` — replace grocery with shufersal + rami-levy in agent table and data sources list
- [ ] Update `src/data-sources/CLAUDE.md` — add REST API pattern examples
- [ ] Update `README.md` — update data source count and list

---

## Dependency Graph
```
Phase 1 (Shufersal) ──┐
                       ├──> Phase 3 (Remove grocery) ──> Phase 4 (Docs)
Phase 2 (Rami Levy) ──┘
```

Phases 1 and 2 can run in parallel. Phase 3 depends on both completing.
