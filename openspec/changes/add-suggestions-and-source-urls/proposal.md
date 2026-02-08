# Change: Add Follow-Up Suggestions Tool and Data Source URL Tools

## Why

Users currently have no way to:
1. Get AI-generated follow-up suggestions after each response - they must think of their own next question
2. View the actual data in the original portal (data.gov.il or CBS) - they only see API URLs or processed summaries

Adding a `suggestFollowUps` client tool lets the agent propose context-aware next steps (queries, comparisons, deeper dives) after every response. Adding `generateDataGovSourceUrl` and `generateCbsSourceUrl` server tools lets the agent provide clickable portal links so users can verify and explore the raw data themselves.

## What Changes

### 1. New Client Tool: `suggestFollowUps`
- New file: `lib/tools/client/suggest-follow-ups.ts`
- Client-side tool (like chart tools) - agent generates suggestions, UI renders them
- Input: array of 2-4 Hebrew suggestion strings
- Rendered in ChatThread below the last message using the `Suggestions` component
- Clicking a suggestion submits it as the next user message via `sendMessage`
- Agent instructions updated to always call this tool at the end of every response

### 2. New Server Tool: `generateDataGovSourceUrl`
- New file: `lib/tools/datagov/generate-source-url.ts`
- Generates human-readable data.gov.il portal URLs for datasets and resources
- URL pattern: `https://data.gov.il/dataset/{datasetName}/resource/{resourceId}`
- Supports optional `?query=` parameter for filtered views
- Returns `{ url, title }` for rendering via SourcesPart

### 3. New Server Tool: `generateCbsSourceUrl`
- New file: `lib/tools/cbs/source/generate-source-url.ts`
- Generates CBS portal/API URLs for series, price indices, and dictionary data
- Supports multiple source types: series data, price indices, localities
- Returns `{ url, title }` for rendering via SourcesPart

### 4. Frontend Updates
- **Suggestions component**: Updated to accept `suggestions` prop (array of strings) instead of using hardcoded `PROMPTS_EXAMPLES`. Landing page keeps existing behavior via default prop or separate usage.
- **ChatThread**: Detects `suggestFollowUps` tool output from the last message and renders Suggestions below the conversation. Suggestion clicks call `sendMessage`.
- **MessageItem**: Extracts portal URLs from `generateDataGovSourceUrl` and `generateCbsSourceUrl` tool results and passes them to `SourcesPart` alongside any existing `source-url` message parts.

### 5. Agent Instructions Update
- Routing agent config updated to instruct the agent to:
  - Always call `suggestFollowUps` with 2-4 relevant Hebrew suggestions at the end of every response
  - Call `generateDataGovSourceUrl` after retrieving data.gov.il data to provide portal links
  - Call `generateCbsSourceUrl` after retrieving CBS data to provide portal/API links

## Impact

- **Affected specs**: agent-tools (3 new tools), chat-ui (suggestions + sources rendering)
- **Affected code**:
  - `lib/tools/client/suggest-follow-ups.ts` - New file
  - `lib/tools/client/index.ts` - Register suggestFollowUps
  - `lib/tools/datagov/generate-source-url.ts` - New file
  - `lib/tools/datagov/index.ts` - Register generateDataGovSourceUrl
  - `lib/tools/cbs/source/generate-source-url.ts` - New file
  - `lib/tools/cbs/index.ts` - Register generateCbsSourceUrl
  - `lib/tools/index.ts` - Export new types
  - `lib/tools/types.ts` - Add type mappings
  - `agents/network/routing/routing.agent.ts` - Register new tools
  - `agents/network/routing/config.ts` - Update instructions
  - `components/chat/Suggestions.tsx` - Accept suggestions prop
  - `components/chat/ChatThread.tsx` - Render suggestions from tool output
  - `components/chat/MessageItem.tsx` - Extract source URLs from tool results
