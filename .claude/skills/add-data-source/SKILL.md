---
name: add-data-source
description: "This skill should be used when the user asks to 'add a data source', 'create a new data source', 'add a new API', 'integrate a new data provider', 'add new tools', or mentions adding Israeli government data, public data APIs, or new agents for data retrieval. Guides through the full process: requirements gathering, OpenSpec proposal creation, and implementation following the project's DataSourceDefinition pattern."
---

# Add New Data Source

Create a new data source module in `src/data-sources/` following the project's established architecture. This skill gathers requirements interactively, creates an OpenSpec proposal, and implements the data source.

## Workflow Overview

1. **Gather requirements** — ask the user structured questions about the new data source
2. **Create OpenSpec proposal** — scaffold `openspec/changes/add-{name}-datasource/`
3. **Implement** — create all files following the DataSourceDefinition pattern
4. **Register** — wire into registry, types, CSS, and agent network
5. **Verify** — run `tsc`, build, and contract tests

## Step 1: Gather Requirements

Before writing any code, ask the user ALL of the following questions. Present them in logical groups (2-3 at a time) to avoid overwhelming.

### Group 1: Identity & API

- **Name**: What is the data source name? (e.g., "transportation", "education")
  - This determines: folder name (kebab-case), agent ID (camelCase + "Agent"), DataSource type
- **API base URL**: What is the API endpoint? (e.g., `https://api.example.gov.il/v1`)
- **API method**: Does the API use GET or POST requests?
- **Authentication**: Does the API require auth (API key, token, none)?
- **Hebrew label**: What Hebrew name should appear in the UI? (e.g., "תחבורה ציבורית")

### Group 2: Structure & Architecture

- **Standalone or subfolder?** Two patterns exist:
  - **Standalone** (like `cbs/`, `knesset/`): Single API, own agent, own folder under `src/data-sources/`
  - **Subfolder under existing source** (like `health/tools/drugs/`, `govmap/tools/nadlan/`): New domain added as a layer within an existing multi-layer data source
- **If subfolder**: Which parent data source? (e.g., `health`, `govmap`)

### Group 3: Agent Architecture

- **Direct sub-agent or nested?** Two delegation patterns:
  - **Direct** (most common): `routingAgent → mySourceAgent` — the routing agent delegates directly
  - **Nested** (rare): `routingAgent → parentAgent → myApiAgent` — used when a parent agent orchestrates multiple sub-APIs (not currently used but supported)
- **MCP-based?** Does this use an MCP endpoint instead of custom tools? (like `budget` source)
  - If yes: tools are auto-discovered via `MCPClient.listTools()`
  - If no: define custom Mastra tools with Zod schemas

### Group 4: Tools & Content

- **Tools**: List the tools this data source needs. For each tool:
  - Tool name (camelCase, e.g., `searchTransportationRoutes`)
  - Brief description
  - Key input parameters
  - What it returns
- **Source URL config**: Do all tools use standard `sourceConfigs` (declarative), or do any need custom `sourceResolvers` with typed input/output?
- **Landing category**: Which tab on the landing page? (`general`, `economy`, `health`)
- **Logo file**: Does the user have a logo image to place in `/public/`?
- **Suggestion prompts**: 2-4 example Hebrew prompts for the empty conversation UI

## Step 2: Create OpenSpec Proposal

After gathering requirements, create an OpenSpec change:

```
openspec/changes/add-{name}-datasource/
├── proposal.md    # Motivation, scope, impact, risks, success criteria
├── design.md      # Architecture, folder structure, tool list, agent instructions outline
├── tasks.md       # Phased implementation checklist
└── specs/{name}-data-source/
    └── spec.md    # ADDED requirements with scenarios
```

Follow the format documented in `openspec/AGENTS.md`. Also create a Notion page in the OpenSpec Changes database (`collection://61973df7-c1a4-49d0-8baf-7fbf2d714968`).

## Step 3: Implement

Read `references/implementation-pattern.md` for the complete file-by-file implementation pattern including:
- API client with retry logic
- Tool creation with `commonToolInput` + `toolOutputSchema()`
- Source URL configs (`sourceConfigs` in `tools/index.ts`) and optional custom resolvers (co-located in tool files)
- Agent factory with standard processors
- Display config and badge
- Hebrew translations
- DataSourceDefinition index.ts
- Contract tests

### Key Rules

- Always use `commonToolInput` mixin — adds `searchedResourceName` (input-only, never in output)
- Always use `toolOutputSchema({...})` — creates discriminated union with error handling
- Include `apiUrl` in tool output (both success and error paths)
- Agent instructions must be in Hebrew with clear section structure
- Translation icons are `LucideIcon` components, not JSX elements
- Source URL configs (`sourceConfigs`) are declared in `tools/index.ts`; custom resolvers are co-located in `.tool.ts` files and collected into `sourceResolvers`

## Step 4: Register

After implementation, register the data source in the system:

1. **`src/data-sources/types/display.types.ts`** — add to `DataSource` union type
2. **`src/data-sources/registry.ts`** — add imports + entry in `DATA_SOURCE_METAS` + spread in `allDataSourceTools`
3. **`src/data-sources/registry.server.ts`** — add agent to `dataSourceAgents`
4. **`src/agents/model.ts`** — add to `SubAgentId` type + switch case for model override
5. **`src/app/globals.css`** — add `--badge-{name}` CSS variables (light + dark mode)

## Step 5: Verify

Run these checks in order:

```bash
tsc --noEmit          # Type check
npm run build         # Build
vitest run            # Tests (contract tests must pass)
```

Verify manually:
- Landing page shows the new data source card in the correct category tab
- Empty conversation shows suggestion prompts
- Routing agent delegates correctly to the new agent
- Tools execute and return proper output with source URLs

## Subfolder Pattern (Multi-Layer)

When adding a domain as a subfolder within an existing data source (like `health/tools/drugs/`):

1. Create `api/{domain}/` with client, endpoints, types
2. Create `tools/{domain}/` with tool files + `index.ts`
3. Update parent `tools/index.ts` to spread the new tools: `{ ...ExistingTools, ...NewDomainTools }`
4. Update parent translations to include new tool entries
5. Update parent agent instructions with new domain section
6. Update parent routing hint to cover new capabilities
7. **Do NOT** add a new entry to `DataSource` type or registry — the parent handles registration

## Additional Resources

### Reference Files

- **`references/implementation-pattern.md`** — Complete file-by-file implementation guide with code templates for every file type (API client, tools, agent, display, translations, index, tests, registry)