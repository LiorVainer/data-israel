# Change: Reduce message storage size to prevent stack overflow on page load

## Why

Chat threads with complex queries (e.g., "train accuracy for last year") crash with `Maximum call stack size exceeded` when loading the page. Root cause: sub-agent tool results store full raw API responses (347KB for a single datagovAgent message), and the `enrichWithSubAgentData()` function loads all sub-agent threads (~576KB total) to reconstruct `data-tool-agent` parts for the UI. The deeply nested JSON exceeds the JS call stack during processing/rendering.

Key findings:
- One `queryDatastoreResource` call stores 20-50 rows × 15+ fields = ~50-100KB per call
- One CBS series call stores hundreds of observation data points
- Chart tool inputs store all data points (12 months × 30+ stations) as tool call `args`
- The LLM already consumed the full data during streaming — stored version is only for UI replay

### What the UI actually reads from sub-agent tool results

**Tool timeline** (`ToolCallParts.tsx`): `success`, `error`, `searchedResourceName`

**Source URL chips** (`source-url-resolvers.ts`): `success`, `apiUrl`, `portalUrl`, `searchedResourceName`, plus small nested objects: `dataset.{title,name}`, `organization.{title,name}`, `resource.name`

**Everything else** (`records`, `fields`, `series`, `observations`, `items`, `resources` arrays, `total`, `limit`, `offset`, etc.) is **not needed for storage** — only the LLM uses it during streaming.

## What Changes

### 1. Strip sub-agent tool results to UI-only fields (processor)
Create a `TruncateToolResultsProcessor` using `processOutputResult` on sub-agents. Instead of truncating arrays, **whitelist** only the fields the UI needs: `success`, `error`, `searchedResourceName`, `apiUrl`, `portalUrl`, `total`, and small nested objects (`dataset.{title,name}`, `organization.{title,name}`, `resource.name`). Everything else is dropped. This could reduce a 100KB tool result to ~200 bytes.

### 2. Strip tool results in enrichment (GET /api/chat — safety net)
Same whitelist stripping in `enrichWithSubAgentData()` for existing oversized messages in Convex.

### 3. Cap chart data array sizes in tool schemas
Add `.max()` constraints to chart tool input schemas to prevent oversized chart data in routing agent messages.

### 4. Cap fields array in queryDatastoreResource
Limit `fields` metadata to 30 entries.

## Impact
- Affected specs: `agent-tools`
- Affected code:
  - `agents/processors/truncate-tool-results.processor.ts` — **NEW** processor
  - `agents/network/datagov/data-gov.agent.ts` — register output processor
  - `agents/network/cbs/cbs.agent.ts` — register output processor
  - `app/api/chat/route.ts` — whitelist stripping in `enrichWithSubAgentData()`
  - `lib/tools/client/display-chart.ts` — `.max()` on data schemas
  - `lib/tools/datagov/query-datastore-resource.ts` — cap fields array
