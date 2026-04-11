# Tasks — add-tool-api-validation-tests

## 0. Setup

- [x] 0.1 Update vitest config to exclude `*-api-validation.test.ts` from default test runs (add to `exclude` array)
- [x] 0.2 Add npm script `test:api` → `vitest run --testPathPattern api-validation` to `package.json`

## 1. CBS API Validation Tests

- [x] 1.1 Create `src/data-sources/cbs/__tests__/cbs-api-validation.test.ts`
- [x] 1.2 Add test cases for all 8 CBS tools (series browsing, data fetching, price indices, locality dictionary)
- [x] 1.3 Verify all tests pass with `vitest run src/data-sources/cbs/__tests__/cbs-api-validation.test.ts`

## 2. DataGov API Validation Tests

- [x] 2.1 Create `src/data-sources/datagov/__tests__/datagov-api-validation.test.ts`
- [x] 2.2 Add test cases for all 15 DataGov tools (search, details, organizations, groups, tags, resources, DataStore)
- [x] 2.3 Verify all tests pass

## 3. GovMap API Validation Tests

- [x] 3.1 Create `src/data-sources/govmap/__tests__/govmap-api-validation.test.ts`
- [x] 3.2 Add test cases for all 7 GovMap tools (deals, statistics, market activity, valuations, address autocomplete)
- [x] 3.3 Verify all tests pass

## 4. Health API Validation Tests

- [x] 4.1 Create `src/data-sources/health/__tests__/health-api-validation.test.ts`
- [x] 4.2 Add test cases for all 11 Health tools — 4 overview-data tools + 7 drug registry tools
- [x] 4.3 Verify all tests pass

## 5. Knesset API Validation Tests

- [x] 5.1 Create `src/data-sources/knesset/__tests__/knesset-api-validation.test.ts`
- [x] 5.2 Add test cases for all 6 Knesset tools (members, bills, committees)
- [x] 5.3 Verify all tests pass

## 6. Shufersal API Validation Tests

- [x] 6.1 Create `src/data-sources/shufersal/__tests__/shufersal-api-validation.test.ts`
- [x] 6.2 Add test case for searchProducts tool
- [x] 6.3 Verify test passes

## 7. Rami Levy API Validation Tests

- [x] 7.1 Create `src/data-sources/rami-levy/__tests__/rami-levy-api-validation.test.ts`
- [x] 7.2 Add test case for searchProducts tool
- [x] 7.3 Verify test passes

## 8. Update Documentation

- [x] 8.1 Update `src/data-sources/CLAUDE.md` — add "Step 9: Write API validation tests" to the "Adding a New Data Source" guide, documenting the `{source}-api-validation.test.ts` pattern (one per sub-API folder or general API folder)
- [x] 8.2 Update `.claude/skills/add-data-source/SKILL.md` — add API validation tests to the "Step 5: Verify" section and the "Subfolder Pattern" section, so future data source additions include these tests

## 9. Final Validation

- [x] 9.1 Run full API validation suite: `npm run test:api` — all tools pass
- [x] 9.2 Verify default `vitest run` does NOT include api-validation tests
- [x] 9.3 Run `tsc --noEmit` — no type errors introduced

## Notes

- Tasks 1-7 are **parallelizable** — each data source test file is independent
- Budget data source is intentionally excluded (MCP-based, dynamic tools)
- Each test uses 30s timeout and sequential execution within file
- Tests use minimal inputs with small result limits to avoid API overload
