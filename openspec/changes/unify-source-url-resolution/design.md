# Design: Unify Source URL Resolution

## Architecture: Before vs After

### Before (3 paths, 8 dedicated tools, 24 hand-written resolvers)

```
Tool Execution
    ↓
    ├─ Path 1: Native source-url parts (AI SDK) ─────→ nativeSourceParts
    │
    ├─ Path 2: Dedicated tools (agent calls) ─────────→ dedicatedSourceParts
    │   └─ 8 generate*SourceUrl tools, each:
    │       - Wastes an agent step + tokens
    │       - Returns { success, url, title }
    │       - Hardcoded urlType: 'portal'
    │       - Shows in AgentInternalCallsChain (unwanted)
    │
    └─ Path 3: 24 hand-written resolver functions ───→ autoSourceParts
        └─ Each does the same thing:
            1. isRecord(output) + getString(output, 'apiUrl') — untyped
            2. getString(input, 'searchedResourceName') — untyped
            3. Return { url, title: `prefix — ${name}`, urlType } | null
            - Scattered across 24 .tool.ts files
            - All identical except the Hebrew title prefix string

MessageItem.tsx: 100+ lines merging 3 paths, special-casing dedicated tools
```

### After (2 paths, 0 dedicated tools, declarative config)

```
Tool Execution
    ↓
    ├─ Path 1: Native source-url parts (AI SDK) ─────→ nativeSourceParts
    │   (unchanged — provider-emitted citations)
    │
    └─ Path 2: Declarative source configs ────────────→ autoSourceParts
        └─ Per-tool ToolSourceConfig: { title: 'סדרה סטטיסטית' }
            - ONE generic resolver in registry builds ToolSource[]
            - Uses ToolOutputSchemaType for type-safe access (no unknown/getString)
            - Both apiUrl AND portalUrl extracted automatically
            - Zero custom resolver functions needed for standard tools

MessageItem.tsx: ~20 lines, one loop
```

## Key Design Decisions

### 1. Declarative ToolSourceConfig replaces 24 hand-written resolver functions

Every resolver does the same thing — only the Hebrew title prefix differs. Replace functions with data:

```typescript
// In tool.types.ts — new declarative type
interface ToolSourceConfig {
    /** Hebrew title prefix (e.g., "סדרה סטטיסטית", "עסקאות נדל"ן") */
    title: string;
}
```

Per data source, in `tools/index.ts`:
```typescript
// BEFORE: import 6 resolver functions, each 10 lines of identical logic
import { resolveSourceUrl as seriesResolver } from './series/get-cbs-series-data.tool';
import { resolveSourceUrl as priceResolver } from './price/get-cbs-price-data.tool';
export const cbsSourceResolvers = { getCbsSeriesData: seriesResolver, getCbsPriceData: priceResolver };

// AFTER: declarative config, zero functions
export const cbsSourceConfigs: Partial<Record<CbsToolName, ToolSourceConfig>> = {
    getCbsSeriesData: { title: 'סדרה סטטיסטית' },
    getCbsSeriesDataByPath: { title: 'סדרה סטטיסטית' },
    getCbsPriceData: { title: 'נתוני מחירים' },
    calculateCbsPriceIndex: { title: 'חישוב מדד' },
};
```

### 2. Type-safe generic resolver using ToolOutputSchemaType

`ToolOutputSchemaType<{}>` already infers to:
```typescript
{ success: true; apiUrl?: string; portalUrl?: string; }
| { success: false; error: string; apiUrl?: string; portalUrl?: string; }
```

The registry has ONE generic function — uses the `ToolSourceResolver` defaults for full type safety:

```typescript
// In registry.ts — replaces all 24 resolver functions
function buildSourceResolver(config: ToolSourceConfig): ToolSourceResolver {
    return (input, output) => {
        if (!output.success) return [];           // discriminated union narrows
        const name = input.searchedResourceName;  // typed string
        const label = name ? `${config.title} — ${name}` : config.title;
        const sources: ToolSource[] = [];
        if (output.portalUrl) sources.push({ url: output.portalUrl, title: label, urlType: 'portal' });
        if (output.apiUrl) sources.push({ url: output.apiUrl, title: label, urlType: 'api' });
        return sources;
    };
}
```

Uses the default type parameters — `TInput = CommonToolInput`, `TOutput = ToolOutputSchemaType<{}>`. Discriminated union narrowing on `output.success` gives direct access to `output.apiUrl` and `output.portalUrl` without casts.

### 3. Custom resolvers for exceptions

A few tools need non-standard title construction (e.g., DataGov's `get-dataset-details` extracts `dataset.title` from nested output). These can still provide a custom `ToolSourceResolver` function alongside the config. The registry checks: custom resolver exists? use it. Otherwise, build from config.

```typescript
// In DataSourceMeta — both options available
interface DataSourceMeta {
    // ...
    sourceConfigs: Partial<Record<string, ToolSourceConfig>>;       // declarative (default)
    sourceResolvers?: Partial<Record<string, ToolSourceResolver>>;  // custom overrides
}
```

### 4. Generic ToolSourceResolver with typed input/output

```typescript
// Current — untyped, forces isRecord()/getString() boilerplate:
type ToolSourceResolver = (input: unknown, output: unknown) => ToolSource | null;

// New — generic with defaults, returns array:
type ToolSourceResolver<
    TInput = CommonToolInput,
    TOutput = ToolOutputSchemaType<{}>
> = (input: TInput, output: TOutput) => ToolSource[];
```

**Type parameter defaults**:
- `TInput` defaults to `CommonToolInput` (`{ searchedResourceName: string }`) — the `commonToolInput` mixin all tools use
- `TOutput` defaults to `ToolOutputSchemaType<{}>` — the base discriminated union (`{ success: true; apiUrl?; portalUrl? } | { success: false; error }`)

**Standard tools**: Use defaults — no type params needed. The generic `buildSourceResolver()` in the registry uses the defaults.

**Custom resolvers**: Specify tool-specific schema types via `z.infer`:

```typescript
// In get-drug-details.tool.ts — types declared as standalone exports alongside schemas
export const getDrugDetailsInputSchema = z.object({ ... });
export const getDrugDetailsOutputSchema = toolOutputSchema({ hebrewName: z.string(), ... });

export type GetDrugDetailsInput = z.infer<typeof getDrugDetailsInputSchema>;
export type GetDrugDetailsOutput = z.infer<typeof getDrugDetailsOutputSchema>;

// Custom resolver uses the exported types — no inline z.infer
export const resolveSourceUrl: ToolSourceResolver<GetDrugDetailsInput, GetDrugDetailsOutput> = (input, output) => {
    if (!output.success) return [];  // discriminated union narrows
    const name = input.searchedResourceName ?? output.hebrewName;  // fully typed!
    const sources: ToolSource[] = [];
    if (output.portalUrl) sources.push({ url: output.portalUrl, title: `פרטי תרופה — ${name}`, urlType: 'portal' });
    return sources;
};
```

**Convention**: Each tool file exports `type {ToolName}Input` and `type {ToolName}Output` as `z.infer` of its schemas. Custom resolvers reference these exported types.

A single tool can produce both API + portal links. Empty array replaces `null`.

### 4b. CommonToolInput type

Add to `tool-schemas.ts`:

```typescript
/** Typed shape of commonToolInput — available as TInput default */
export type CommonToolInput = { searchedResourceName: string };
```

This is inferred from the `commonToolInput` Zod fragment and used as the default `TInput` in `ToolSourceResolver`.

### 5. Add portalUrl to tool outputs that lack it

Tools that currently return only `apiUrl` (knesset, govmap, shufersal, rami-levy, etc.) add `portalUrl` to their `execute()` function. The portal URL construction logic moves FROM the deleted `generate*SourceUrl` tools INTO the data tool's execute.

This is safe because `portalUrl` is already in `externalUrls` / `toolOutputSchema` — the schema already allows it, tools just weren't setting it.

### 6. Simplified MessageItem.tsx

```typescript
// Path 1: Native AI SDK source-url parts (unchanged)
const nativeSourceParts = message.parts
    .filter((p): p is SourceUrlUIPart => p.type === 'source-url')
    .map((p) => ({ ...p, urlType: 'portal' as const }));

// Path 2: Unified resolution from all tool outputs
const autoSourceParts = resolveAllToolSources(message.parts);

// Merge + deduplicate
const allSources = deduplicateSources([...nativeSourceParts, ...autoSourceParts]);
```

### 7. Backward compat for old conversations

Old persisted `data-tool-agent` parts may contain `generate*SourceUrl` tool results. The `resolveAllToolSources` function includes a deprecated fallback: if a tool result's name matches the old pattern, extract the URL directly. Mark with `// DEPRECATED` comment.

## What changes per data source

| Source | sourceConfigs (new, declarative) | Custom resolver needed? |
|--------|----------------------------------|------------------------|
| CBS | 4 entries (series, seriesByPath, price, priceIndex) | No |
| DataGov | 4 entries (datastore, resource, organization, dataset) | Yes for dataset (extracts `dataset.title`) |
| GovMap | 6 entries (deals, street, neighborhood, valuation, market, statistics) | No |
| Knesset | 5 entries (bills, bill, committees, committee, members) | No |
| Shufersal | 1 entry (searchProducts) | No |
| Rami Levy | 1 entry (searchProducts) | No |
| Health (drugs) | 2 entries (searchByName, getDrugDetails) | Yes for getDrugDetails (extracts `hebrewName`) |
| Health (overview) | 1 entry (getHealthData) | No |
| Budget | N/A (MCP-based) | N/A |

## What gets deleted

- 8 `generate-source-url.tool.ts` files
- 24 `resolveSourceUrl` function exports from `.tool.ts` files
- 24 `isRecord()` + `getString()` helper functions duplicated across tool files
- `SOURCE_URL_TOOL_NAMES` constant from registry
- ~80 lines of source collection logic from MessageItem.tsx
- "call generateSourceUrl" instructions from all agent prompts
