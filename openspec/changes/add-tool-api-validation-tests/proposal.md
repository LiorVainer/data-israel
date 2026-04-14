# Add Tool API Validation Tests

## Summary

Add live API validation tests for every data source tool that calls an external API. Each test invokes the tool's `execute` function with real API parameters and validates the response against the tool's declared Zod `outputSchema`. This catches schema drift — when an external API changes its response shape — before it reaches production.

## Motivation

We just discovered that the Health data source's `getHealthMetadata` tool had a completely wrong `HealthMetadataResponse` type — the real API returns `{ cards, sections, links }` but the code expected `{ availableEndpoints, sections: [{sectionId, sectionTitle}] }`. The tool silently returned "no data points found" for every subject because `availableEndpoints` was always `undefined`.

Existing contract tests (`*-data-source.test.ts`) verify the `DataSourceDefinition` structure (translation keys, resolver keys, schema shapes) but **never hit the real APIs**. There is no test that catches when an external API's response no longer matches our Zod output schema.

## Scope

- **In scope**: One new test file per data source (`__tests__/{source}-api-validation.test.ts`) that:
  1. Calls each tool's `execute()` with minimal valid inputs
  2. Validates the result against the tool's `outputSchema` using `schema.safeParse()`
  3. Runs against **real external APIs** (not mocked)
  4. Skipped in CI by default (tagged with a custom test group), run on-demand
- **In scope (documentation)**: Update `src/data-sources/CLAUDE.md` and `.claude/skills/add-data-source/SKILL.md` so future data source additions include API validation tests as a required step
- **Out of scope**:
  - Budget (MCP-based, tools are dynamic)
  - Mocking or stubbing APIs
  - Changing tool implementations
  - Modifying existing contract tests

## Data Sources Covered

| Source | Tools | External API |
|--------|-------|-------------|
| CBS | 8 | data.gov.il, CBS API |
| DataGov | 15 | data.gov.il CKAN |
| GovMap | 7 | govmap.gov.il |
| Health | 11 | datadashboard.health.gov.il, israeldrugs.health.gov.il |
| Knesset | 6 | knesset.gov.il OData |
| Shufersal | 1 | shufersal XML feeds |
| Rami Levy | 1 | rami-levy API |

**Total: 49 tools across 7 data sources**

## Design Decisions

### Test Pattern

Each test file follows the same structure:

```typescript
describe('{Source} API validation', () => {
  it('{toolName} output matches schema', async () => {
    const result = await toolObject.execute({ /* minimal valid input */ }, {} as any);
    const parsed = outputSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
```

### Why `execute()` directly, not via Mastra agent?

- Tools are pure functions — `execute(input)` → output
- No agent overhead, no model calls, no memory
- Tests validate **API response ↔ schema contract**, not agent behavior

### Test grouping

Tests hit real external APIs, so they:
- Are placed in a separate file (`*-api-validation.test.ts`) from contract tests
- Use a longer timeout (30s per test)
- Are excluded from default `vitest run` via a path/tag filter
- Can be run on-demand: `vitest run --testPathPattern api-validation`

### Error responses are valid too

If an API returns an error (rate limited, maintenance), the tool should still return a valid error-branch output (`{ success: false, error: string }`). The test validates **schema conformance**, not data correctness.

## Risks

- **External API availability**: Tests may fail if APIs are down. Mitigation: tests are not in CI, run on-demand only.
- **Rate limiting**: Running all 49 tools at once may trigger rate limits. Mitigation: sequential execution, reasonable inputs.
- **Flaky by nature**: External APIs can change at any time. This is **the point** — catching changes is the goal.

## Spec Deltas

- `tool-api-validation` — new capability for live API schema validation tests
