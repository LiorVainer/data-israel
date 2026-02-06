# Design: API URL Display for Tool Calls

## Context
The agent calls 23 tools (15 DataGov + 8 CBS) that hit external APIs. Currently, users see only tool names in the UI. Adding URL visibility requires:
1. Centralized endpoint constants
2. Deterministic URL construction
3. Passing URLs through tool output
4. UI rendering of URLs

## Goals
- Users see exact API URLs being fetched in the tool call timeline
- URLs are constructed deterministically (same inputs = same URL)
- Endpoint paths are centralized and reusable
- Minimal changes to existing tool schemas

## Non-Goals
- Modifying the actual API calls (URLs are display-only)
- Adding URL to tool input (LLM should not generate URLs)
- Caching or deduplicating API calls

## Decisions

### 1. URL in Tool Output (Not Input)
**Decision**: Add `apiUrl` to tool **output** schema, not input.

**Rationale**:
- LLM should not generate URLs (hallucination risk)
- Tool constructs URL from validated inputs
- URL is a side-effect/metadata of the call, not an instruction

**Alternative Considered**: URL in input schema with `.describe()` instructions
- Rejected: LLM might hallucinate invalid URLs
- Rejected: Adds unnecessary complexity to input validation

### 2. Endpoint Constants Structure
**Decision**: Create `endpoints.ts` files with typed endpoint builders.

```typescript
// lib/api/cbs/endpoints.ts
export const CBS_ENDPOINTS = {
  series: {
    BASE_URL: 'https://apis.cbs.gov.il/series',
    catalog: '/catalog/level',
    catalogByPath: '/catalog/path',
    data: '/data/list',
    dataByPath: '/data/path',
  },
  priceIndex: {
    BASE_URL: 'https://api.cbs.gov.il/index',
    catalog: '/catalog/catalog',
    chapter: '/catalog/chapter',
    subject: '/catalog/subject',
    price: '/data/price',
    calculator: (id: string) => `/data/calculator/${encodeURIComponent(id)}`,
  },
  dictionary: {
    BASE_URL: 'https://api.cbs.gov.il/dictionary',
    search: (subject: string, resource: string) => `/${subject}/${resource}`,
  },
} as const;

// Helper to build full URL with params
export function buildCbsUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}
```

**Rationale**:
- Single source of truth for endpoints
- Type-safe path builders for dynamic segments
- Reusable across tools and tests

### 3. Output Schema Extension
**Decision**: Extend each tool's output schema with optional `apiUrl` and `searchedResourceName`.

```typescript
// Before
export const getCbsSeriesDataOutputSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), series: z.array(...) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);

// After (for specific entity tools)
export const getCbsSeriesDataOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    series: z.array(...),
    apiUrl: z.string().optional().describe('The API URL that was fetched'),
    searchedResourceName: z.string().describe('Hebrew display name of the fetched resource'),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    apiUrl: z.string().optional().describe('The API URL that was attempted'),
    searchedResourceName: z.string().describe('Hebrew display name of the resource that was attempted'),
  }),
]);
```

### 4. searchedResourceName Input Parameter
**Decision**: Add optional `searchedResourceName` input parameter to specific entity tools (not exploration tools).

**Rationale**:
- Exploration tools (browse-*, search-*, list-*) discover available resources
- Specific entity tools (get-*, query-*) fetch known resources by ID
- The AI agent discovers resource names via exploration, then passes them to specific tools
- This provides a Hebrew display label for the UI without requiring another API call

**Tools with searchedResourceName**:
- CBS: `get-cbs-series-data`, `get-cbs-series-data-by-path`, `get-cbs-price-data`, `calculate-cbs-price-index`
- DataGov: `get-dataset-details`, `get-dataset-activity`, `get-resource-details`, `query-datastore-resource`, `get-organization-details`, `get-organization-activity`

**Tools WITHOUT searchedResourceName** (exploration/list tools):
- CBS: `browse-cbs-catalog`, `browse-cbs-catalog-path`, `browse-cbs-price-indices`, `search-cbs-localities`
- DataGov: `search-datasets`, `list-all-datasets`, `search-resources`, `list-organizations`, `list-groups`, `list-tags`, `get-status`, `get-dataset-schema`

```typescript
// Input schema example
export const getCbsSeriesDataInputSchema = z.object({
  seriesId: z.string().describe('The series ID to fetch'),
  searchedResourceName: z.string().describe(
    'Hebrew display name of the series (from catalog browsing). Shown in UI as badge label.'
  ),
  // ... other params
});
```
```

### 5. UI Display Pattern
**Decision**: Use `ChainOfThoughtSearchResults` with badges showing resource names and clickable URLs.

```tsx
// ToolCallStep.tsx
<ChainOfThoughtStep ...>
  {step.resources && step.resources.length > 0 && (
    <ChainOfThoughtSearchResults>
      {step.resources.map((resource, i) => (
        <ChainOfThoughtSearchResult key={i} asChild>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" title={resource.url}>
            {resource.name || new URL(resource.url).pathname}
          </a>
        </ChainOfThoughtSearchResult>
      ))}
    </ChainOfThoughtSearchResults>
  )}
</ChainOfThoughtStep>
```

**Rationale**:
- Badge shows Hebrew `searchedResourceName` when available (user-friendly)
- Falls back to URL pathname for exploration tools
- Full URL accessible via click (opens in new tab) or hover (title attribute)
- Reuses existing AI Elements component

### 6. URL and Resource Name Extraction from Tool Output
**Decision**: Extract `apiUrl` and `searchedResourceName` from tool output in grouping logic.

```typescript
// ToolCallParts.tsx
interface ToolResource {
  url: string;
  name?: string; // Hebrew display name
}

function groupToolCalls(toolParts: ReadonlyArray<{ part: ToolCallPart; index: number }>): GroupedToolCall[] {
  // Collect resources (URL + optional name) from each tool's output
  const output = part.output as { apiUrl?: string; searchedResourceName?: string } | undefined;
  if (output?.apiUrl) {
    const resource: ToolResource = { url: output.apiUrl };
    if (output.searchedResourceName) {
      resource.name = output.searchedResourceName;
    }
    existing.resources = [...(existing.resources || []), resource];
  }
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| URL construction diverges from actual API call | Use same constants in both client.ts and tools |
| Large URLs clutter UI | Show only pathname, full URL on hover/click |
| Performance: URL parsing in render | Memoize URL display extraction |

## Migration Plan
1. Add endpoint constants (no behavior change)
2. Update tool outputs to include `apiUrl`
3. Update UI to render URLs
4. All changes are additive, no migration needed

## Open Questions
- Should we show query parameters in the badge or only the path?
  - **Recommendation**: Show path only, full URL on click
- Should failed requests show the attempted URL?
  - **Recommendation**: Yes, helps debugging
