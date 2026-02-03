# Change: Add API URL Display to Tool Calls

## Why
Users currently see tool names like "חיפוש מידע" (Search Data) but have no visibility into which actual API endpoints are being called. Showing the API URLs provides transparency, helps debugging, and educates users about the data sources being queried.

## What Changes
- New `endpoints.ts` constant files for CBS and DataGov APIs defining all endpoint paths
- Each tool input schema gains an **output-only** `apiUrl` field that the tool populates after constructing the request
- Tool execute functions construct and return the full API URL with query parameters
- UI displays API URLs using `ChainOfThoughtSearchResults` badges in the tool call timeline
- Tools remain grouped by name but each group shows the unique URLs fetched

## Impact
- Affected specs: `agent-tools`, `chat-ui`
- Affected code:
  - `lib/api/cbs/endpoints.ts` (new)
  - `lib/api/data-gov/endpoints.ts` (new)
  - `lib/tools/cbs/**/*.ts` (8 tools)
  - `lib/tools/datagov/**/*.ts` (15 tools)
  - `components/chat/ToolCallStep.tsx`
  - `components/chat/ToolCallParts.tsx`
  - `components/chat/types.ts`
- No breaking changes to existing functionality
- URLs are constructed deterministically from schema + inputs
