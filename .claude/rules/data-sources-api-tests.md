---
paths:
  - "src/data-sources/**/__tests__/*api-validation.test.ts"
---

# Data Sources — API Validation Test Rules

Rules for `*-api-validation.test.ts` files only. These conventions differ significantly from contract tests in the same `__tests__` folder — this rule fires exactly on the API-validation filename pattern to keep them separated.

## Purpose

API validation tests hit **real external APIs** and validate that tool outputs match their declared schemas. They catch schema drift when external APIs change shape — a failure mode contract tests cannot detect.

One file per sub-API folder (e.g., `health/tools/drugs/`, `health/tools/overview-data/`) or per general API folder, depending on the source's structure.

## Template

```typescript
import { describe, it, expect } from 'vitest';
// Import tools and their output schemas from the tool files
import { myTool, myToolOutputSchema } from '../tools/my-tool.tool';

describe.sequential('{Source} API validation', () => {
  it('myTool output matches schema', async () => {
    const result = await myTool.execute(
      { searchedResourceName: 'test', /* minimal valid inputs */ },
      {} as any,
    );
    const parsed = myToolOutputSchema.safeParse(result);
    if (!parsed.success) console.error(parsed.error.issues);
    expect(parsed.success).toBe(true);
  }, 30_000);
});
```

## Hard rules

- **One `it()` per tool** — every tool in the data source must have a test case.
- **Real APIs, not mocked** — the entire point is to catch schema drift when external APIs change.
- **Both success and error are valid results** — the test validates *schema conformance*, not data correctness.
- **30s timeout per test** — external APIs can be slow.
- **`describe.sequential`** — avoid concurrent requests to the same API host (some Israeli APIs rate-limit aggressively).
- **Small limits** — use `maxResults: 3`, `limit: 3` to minimize API load.
- **Always include `searchedResourceName: 'test'`** — it's a required input-only field on every tool.
- **Excluded from the default test run** — these files are excluded in `vitest.config.ts` and run on-demand via `npm run test:api`.
- **Budget source is excluded** — MCP-based sources have dynamically discovered tools; no API validation tests needed.
