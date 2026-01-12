# Design Document: AI SDK v6 Agent Tools

## Context

The project uses Next.js 16 with the AI SDK v6 to build an agent that explores Israeli open data. The spec/project.spec.md defines a tool-first architecture where the agent must use explicit tools to query the data.gov.il CKAN API rather than hallucinating information.

The MCP reference files (mcp-ref/mcp.ts, mcp-ref/mcp.py) provide conceptual guidance but are NOT executed at runtime. We need native AI SDK v6 tools that can be used in a Next.js environment.

**Key Constraints:**
- TypeScript strict mode enabled
- Minimize `as` type assertions and `any` types
- Must use data.gov.il CKAN API (Israeli open data, not US data.gov)
- All tools must use Zod validation
- Tools must return structured JSON, not free text

## Goals / Non-Goals

### Goals
- Implement AI SDK v6 tools for four core CKAN operations
- Use Zod for input/output validation and type inference
- Create reusable CKAN API client for future extensibility
- Maintain strict TypeScript type safety
- Follow project conventions (path aliases with `@/`)

### Non-Goals
- Implementing the agent itself (separate change)
- Creating a UI (separate change)
- Implementing the optional resource fetch tool (deferred)
- Direct MCP integration (explicitly avoided per spec)
- Authentication/API keys (CKAN API is public)

## Decisions

### Decision 1: API Base URL
**Choice:** Use `https://data.gov.il/api/3` as the base URL

**Rationale:**
- The MCP reference uses `https://catalog.data.gov/api/3` (US data.gov)
- The spec explicitly mentions "Israeli open data (data.gov.il)"
- Israeli data portal is at data.gov.il, not catalog.data.gov

**Alternatives Considered:**
- Using US data.gov API: Rejected because spec requires Israeli data
- Hardcoding in each tool: Rejected for maintainability

### Decision 2: Tool Naming Convention
**Choice:** Use camelCase names (searchDatasets, getDatasetDetails, listGroups, listTags)

**Rationale:**
- Consistent with JavaScript/TypeScript conventions
- More readable than snake_case (package_search → searchDatasets)
- AI SDK v6 tools are registered with these names

**Alternatives Considered:**
- Keeping MCP names (package_search): Rejected for consistency
- Using PascalCase: Rejected, reserved for types/classes

### Decision 3: Directory Structure
**Choice:**
```
lib/
  tools/                      # AI SDK tool definitions
    search-datasets.ts        # searchDatasets tool using tool() helper
    get-dataset-details.ts    # getDatasetDetails tool
    list-groups.ts            # listGroups tool
    list-tags.ts              # listTags tool
    index.ts                  # Export all tools
  api/
    data-gov/                 # Data.gov.il API client (not ckan)
      client.ts               # axios-based client (exports dataGovApi)
      types.ts                # TypeScript interfaces
agents/
  data-agent.ts               # ToolLoopAgent instance definition
app/
  api/
    chat/
      route.ts                # API route for streaming agent responses
```

**Rationale:**
- Follows AI SDK v6 conventions: tools in `lib/tools/`, agent in `agents/`
- Separates concerns: tools (reusable) vs agent (composition)
- Agent definition separate from API route (better testability)
- API route uses `createAgentUIStreamResponse` for streaming
- Tools use `tool()` helper from AI SDK, not manual objects
- Named `data-gov` for domain clarity (reflects data.gov.il)

**Alternatives Considered:**
- Flat structure: Rejected, harder to maintain
- lib/agent/tools/: Rejected, AI SDK examples use lib/tools/
- Inline agent in API route: Rejected, reduces testability
- lib/api/ckan/: Rejected, technical protocol name less intuitive

### Decision 4: Tool Definition Pattern
**Choice:** Use AI SDK v6 `tool()` helper with inline Zod schemas

**Rationale:**
- AI SDK v6 native pattern: `tool({ description, inputSchema, execute })`
- Automatic type inference from Zod schema
- No need for separate type definitions
- Tools are portable and can be published as npm packages
- Consistent with AI SDK documentation and examples

**Example:**
```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const searchDatasets = tool({
  description: 'Search for datasets on data.gov.il by keyword',
  inputSchema: z.object({
    query: z.string().optional().describe('Search query'),
    sort: z.string().optional().describe('Sort order'),
    rows: z.number().int().min(1).max(100).optional().describe('Results per page'),
    start: z.number().int().min(0).optional().describe('Starting offset'),
  }),
  execute: async ({ query, sort, rows = 10, start = 0 }) => {
    const result = await dataGovApi.dataset.search({ q: query, sort, rows, start });
    return {
      success: true,
      count: result.count,
      datasets: result.results.map(d => ({
        id: d.id,
        title: d.title,
        organization: d.organization?.title,
        tags: d.tags.map(t => t.name),
      })),
    };
  },
});
```

**Alternatives Considered:**
- Manual objects with validation: Rejected, not AI SDK v6 pattern
- Manual type guards like MCP ref: Rejected, more error-prone
- No validation: Rejected, violates spec requirement

### Decision 5: Error Handling Strategy
**Choice:** Return structured error objects, not throw exceptions

**Rationale:**
- AI SDK v6 tools should return results, not throw
- Agent can reason about errors and retry
- Consistent with tool-first architecture

**Structure:**
```typescript
{
  success: false,
  error: {
    message: string,
    code: string,
    details?: unknown
  }
}
```

**Alternatives Considered:**
- Throwing exceptions: Rejected, disrupts agent flow
- Returning null/undefined: Rejected, loses error context

### Decision 6: Agent Creation Pattern
**Choice:** Use `ToolLoopAgent` with system instructions and tools

**Rationale:**
- AI SDK v6 recommended pattern for agentic workflows
- Automatic tool orchestration in a loop
- Built-in step tracking and debugging
- Supports structured output with Zod schemas
- Can set stop conditions (e.g., max steps)

**Example:**
```typescript
import { ToolLoopAgent } from 'ai';
import { searchDatasets, getDatasetDetails, listGroups, listTags } from '@/lib/tools';

export const dataAgent = new ToolLoopAgent({
  model: 'anthropic/claude-sonnet-4.5',
  instructions: `You are an AI agent designed to explore Israeli open datasets from data.gov.il.

You have tools for:
- Searching datasets by keyword
- Inspecting dataset metadata
- Listing groups (publishers/categories)
- Listing tags (taxonomy)

You must use these tools for factual answers. Do not guess dataset contents.`,
  tools: {
    searchDatasets,
    getDatasetDetails,
    listGroups,
    listTags,
  },
});

export type DataAgentUIMessage = InferAgentUIMessage<typeof dataAgent>;
```

**Alternatives Considered:**
- `generateText` with tools: Rejected, no multi-step orchestration
- Custom agent loop: Rejected, reinventing the wheel
- Streaming with `streamText`: Will be used in API route, not agent definition

### Decision 7: HTTP Client with Generic Wrapper
**Choice:** Use `axios` with a generic `dataGovGet<T>()` wrapper function

**Rationale:**
- Consistent with MCP reference implementation
- Better error handling and interceptors support
- Automatic JSON transformation
- **Generic wrapper eliminates repetitive DataGovResponse unwrapping**
- Single source of truth for response handling
- Type-safe with TypeScript generics
- Request/response interceptors for logging/debugging
- Built-in timeout and cancellation support

**Pattern:**
```typescript
// Generic wrapper - write once, use everywhere
async function dataGovGet<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
  const response = await axiosInstance.get<DataGovResponse<T>>(endpoint, { params });
  return response.data.result; // Unwrap automatically
}

// Organized API with nested namespaces
export const dataGovApi = {
  dataset: {
    search: async (params) => {
      return dataGovGet<{ count: number; results: Dataset[] }>('/action/package_search', params);
    },
    show: async (id: string) => {
      return dataGovGet<Dataset>('/action/package_show', { id });
    },
  },
  group: {
    list: async (params) => {
      return dataGovGet<Group[]>('/action/group_list', params);
    },
  },
  tag: {
    list: async (params) => {
      return dataGovGet<Tag[]>('/action/tag_list', params);
    },
  },
};
```

**API Organization:**
- Named `dataGovApi` (not `ckan`) for clarity
- Nested namespaces group related operations:
  - `dataGovApi.dataset.search()` / `dataGovApi.dataset.show()`
  - `dataGovApi.group.list()`
  - `dataGovApi.tag.list()`
- More discoverable with IDE autocomplete
- Clearer intent: `api.dataset.search()` vs `api.packageSearch()`
- Reflects the domain (Israeli data.gov.il)
- Extensible: easy to add more methods under each namespace

**Alternatives Considered:**
- Native fetch: Rejected, less ergonomic for error handling
- Inline response unwrapping in each method: Rejected, repetitive and harder to maintain
- Flat structure (packageSearch, groupList): Rejected, less organized as API grows
- Custom HTTP wrapper class: Rejected, over-engineering

## Risks / Trade-offs

### Risk 1: API URL Change
**Risk:** If data.gov.il changes their API URL or structure

**Mitigation:**
- Centralize URL in `client.ts`
- Environment variable override capability (future)
- Clear documentation of API version (/api/3)

### Risk 2: Large Response Payloads
**Risk:** CKAN API may return very large datasets

**Mitigation:**
- Use pagination parameters (rows, start, limit, offset)
- Document recommended limits in tool descriptions
- Future: Add client-side size limits

### Trade-off 1: Type Safety vs Flexibility
**Choice:** Strict Zod validation

**Trade-off:**
- ✅ Pro: Catches errors early, prevents hallucination
- ⚠️ Con: Schema updates needed if API changes
- **Accepted:** Type safety is more important per spec

### Trade-off 2: Separate Files vs Single File
**Choice:** One tool per file

**Trade-off:**
- ✅ Pro: Easy to navigate, clear separation
- ⚠️ Con: More files to manage
- **Accepted:** Maintainability wins

## Migration Plan

N/A - This is new functionality with no existing code to migrate.

## Open Questions

1. **Should we add rate limiting?**
   - Deferred: No evidence of rate limits on data.gov.il CKAN API
   - Can be added later if needed

2. **Should we cache responses?**
   - Deferred: Caching strategy should be decided at agent/UI level
   - Tools remain stateless for now

3. **Should we implement the resource fetch tool?**
   - Deferred: Marked as optional in spec
   - Can be added in separate change if needed

4. **What about API authentication?**
   - Not needed: CKAN API is public, no auth required
   - If auth is added later, client.ts can be extended
