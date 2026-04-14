# Change: Add Data Source Multi-Picker to Chat Input

## Why
Users currently have no control over which data sources the AI routing agent queries. All 9 sources are always active, leading to slower responses (e.g., MCP sources), irrelevant routing, and higher token costs. A data source picker lets users focus the agent on specific sources for a given conversation turn.

## What Changes
- New `DataSourcePicker` component — Popover + Command multi-select grouped by `LANDING_CATEGORIES`, with source logos and checkmarks
- Trigger button lives inside the `PromptInput` bottom toolbar (like "GPT-4o" in ChatGPT's input) showing "בחר מקורות מידע" when all selected, or "X מקורות מידע נבחרו" when a subset is selected
- Selection state lives in `ChatThread`, flows via `InputSection` → transport body → API route
- `getMastraWithModels` in `mastra.ts` accepts an optional `enabledSources` filter to build a Mastra instance with only the selected sub-agents
- Routing agent physically cannot call filtered-out sub-agents (they're excluded from the `agents` record on `new Agent()`)

## Impact
- Affected specs: `agent-tools` (routing agent behavior changes based on source filter)
- Affected code:
  - `src/components/chat/DataSourcePicker.tsx` — NEW
  - `src/components/chat/InputSection.tsx` — add picker in footer toolbar
  - `src/components/chat/ChatThread.tsx` — selection state, transport body
  - `src/agents/mastra.ts` — `getMastraWithModels` accepts source filter
  - `src/app/api/chat/route.ts` — read + validate `enabledSources` from body
  - `src/data-sources/registry.ts` — export `ALL_DATA_SOURCE_IDS` + `getDataSourcePickerItems()`
