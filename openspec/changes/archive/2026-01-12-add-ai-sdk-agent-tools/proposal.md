# Change: Add AI SDK v6 Agent Tools for Israeli Open Data

## Why

The project specification (spec/project.spec.md) defines a tool-first agent architecture for exploring Israeli open data from data.gov.il. Currently, no tools exist—only MCP reference files that cannot be used at runtime. We need to implement AI SDK v6 agent tools with Zod validation to enable the agent to query the CKAN API.

## What Changes

- Create AI SDK v6 tools inspired by MCP reference implementations
- Implement four core tools for data.gov.il CKAN API interaction:
  - **searchDatasets**: Search for datasets by keyword, with sorting and pagination
  - **getDatasetDetails**: Retrieve full metadata for a specific dataset
  - **listGroups**: Enumerate dataset publishers and categories
  - **listTags**: Explore dataset taxonomy and keywords
- Define Zod schemas for all tool inputs and outputs
- Implement error handling for API failures
- Create reusable Data.gov.il API client with axios
- Use generic `dataGovGet<T>()` wrapper to eliminate repetitive response unwrapping
- Add TypeScript types for all data structures

## Impact

- **Affected specs**: New capability `agent-tools`
- **Affected code**:
  - New directory: `lib/tools/` (AI SDK v6 tool definitions using `tool()` helper)
  - New directory: `lib/api/data-gov/` (Data.gov.il API client with axios)
  - New directory: `agents/` (ToolLoopAgent instance)
  - New file: `lib/tools/index.ts` (tool exports)
  - New files: `lib/tools/search-datasets.ts`, `get-dataset-details.ts`, `list-groups.ts`, `list-tags.ts`
  - New file: `lib/api/data-gov/client.ts` (axios-based API client named `dataGovApi`)
  - New file: `lib/api/data-gov/types.ts` (TypeScript interfaces for API responses)
  - New file: `agents/data-agent.ts` (ToolLoopAgent with system instructions)
  - New file: `app/api/chat/route.ts` (API endpoint for streaming agent responses)
- **Dependencies**: Will need to add `ai`, `zod`, and `axios` packages to package.json
- **AI SDK v6 Features Used**:
  - `tool()` helper for tool definitions
  - `ToolLoopAgent` for multi-step agent orchestration
  - `createAgentUIStreamResponse()` for streaming to UI
  - `InferAgentUIMessage` for type-safe message handling

## Non-Breaking Change

This is a purely additive change. No existing code is modified. Tools will be imported and used by the agent in a future change.
