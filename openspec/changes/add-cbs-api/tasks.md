## 1. API Client Layer
- [ ] 1.1 Create `lib/api/cbs/types.ts` with TypeScript interfaces
- [ ] 1.2 Create `lib/api/cbs/client.ts` with axios instances and namespaced API
- [ ] 1.3 Create `lib/api/cbs/swagger.json` OpenAPI 3.0 artifact

## 2. Agent Tools
- [ ] 2.1 Create `browse-cbs-catalog` tool
- [ ] 2.2 Create `get-cbs-series-data` tool
- [ ] 2.3 Create `browse-cbs-price-indices` tool
- [ ] 2.4 Create `get-cbs-price-data` tool
- [ ] 2.5 Create `calculate-cbs-price-index` tool
- [ ] 2.6 Create `search-cbs-localities` tool

## 3. Integration
- [ ] 3.1 Update `lib/tools/index.ts` with CBS exports
- [ ] 3.2 Update `lib/tools/types.ts` with CBS type mappings
- [ ] 3.3 Update `agents/data-agent.ts` with CBS tools and instructions

## 4. Verification
- [ ] 4.1 `tsc` passes
- [ ] 4.2 `npm run build` succeeds
- [ ] 4.3 `npm run lint` passes
- [ ] 4.4 `npm run vibecheck` passes
