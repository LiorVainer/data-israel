# Data Sources Architecture

Self-contained data source modules. Each folder provides everything needed: API client, tools, agent, translations, display config, and source URL resolvers.

## Structure

```
src/data-sources/
├── types/                          # Shared types & Zod schema fragments
│   ├── data-source.types.ts        # DataSourceDefinition<TTools> interface
│   ├── tool.types.ts               # ToolSourceResolver, ToolTranslation, ToolResourceExtractor
│   ├── tool-schemas.ts             # commonToolInput, externalUrls, toolOutputSchema()
│   ├── display.types.ts            # AgentDisplayInfo, DataSource, DataSourceConfig, LANDING_CATEGORIES
│   └── index.ts                    # Re-exports
├── registry.ts                     # Client-safe aggregation (tools, translations, resolvers, extractors)
├── registry.server.ts              # Server-only agent references (@mastra/core/agent)
├── cbs/                            # CBS data source (9 tools)
├── datagov/                        # DataGov data source (16 tools)
├── budget/                         # BudgetKey data source (3 MCP tools)
├── govmap/                         # GovMap multi-layer data source (8 tools, real estate layer)
├── drugs/                          # Israel Drugs data source (8 tools)
├── health/                         # IL Health data source (5 tools)
└── grocery/                        # Grocery Prices data source (5 tools)
```

## Per-Source Folder Structure

```
{source}/
├── api/
│   ├── {source}.client.ts          # API client (Axios instances, retry logic)
│   ├── {source}.types.ts           # API response types
│   └── {source}.endpoints.ts       # Base URLs, path builders
├── tools/
│   ├── {tool-name}.tool.ts         # Tool def + optional typed resolveSourceUrl export
│   └── index.ts                    # {Source}Tools object + {Source}ToolName type + sourceConfigs
├── __tests__/
│   └── {source}-data-source.test.ts # Contract tests (REQUIRED)
├── {source}.agent.ts               # Agent factory + system prompt instructions
├── {source}.translations.tsx       # Hebrew tool translations (LucideIcon, not JSX)
├── {source}.display.ts             # AgentDisplayInfo + badge config
└── index.ts                        # Exports {Source}DataSource satisfies DataSourceDefinition
```

## Adding a New Data Source

### Step 0: Check Israeli egress reachability (BEFORE writing any code)

Before implementing a new data source, verify that the upstream API responds from **non-Israeli egress** (Vercel's default regions). Some Israeli APIs geo-block, geo-degrade, or silently return HTML / Atom XML instead of JSON when called from outside Israel. If the API only works reliably from Israel, the client MUST route through the Bright Data proxy.

**How to check:**

1. From a non-Israeli network (your Vercel Preview URL, or a non-IL VPS, or add the API to `src/app/api/debug/upstream-probe/route.ts`), issue a representative request.
2. Compare against the same request from an Israeli IP.
3. Any of the following indicates geo-gating:
   - HTTP 403, 451, or Cloudflare/Akamai challenge page
   - HTML body when JSON was expected
   - Empty `{ value: [] }` / `{ results: [] }` responses that should contain data
   - Timeouts that only occur from non-IL

**If the API needs Israeli egress**, wire the client through the Bright Data proxy helper (same pattern used by `knesset`, `shufersal`, and `rami-levy`):

```typescript
// src/data-sources/{name}/api/{name}.client.ts
import axios, { type AxiosInstance } from 'axios';
import { getBrightDataAgent } from '@/lib/proxy/bright-data';
import { MY_BASE_URL } from './{name}.endpoints';

// Opt into Israeli egress via Bright Data when BRIGHT_DATA_PROXY_URL is set.
// `proxy: false` is required so axios does not layer its own proxy logic
// on top of the HttpsProxyAgent.
const brightDataAgent = getBrightDataAgent();

const myInstance: AxiosInstance = axios.create({
    baseURL: MY_BASE_URL,
    timeout: 30_000,
    headers: { Accept: 'application/json', 'User-Agent': 'DataIsrael-Agent/1.0' },
    ...(brightDataAgent && {
        httpsAgent: brightDataAgent,
        httpAgent: brightDataAgent,
        proxy: false as const,
    }),
});
```

**Rules:**
- Only import `getBrightDataAgent` from `@/lib/proxy/bright-data` in the client file — never from tools, agents, or UI code.
- Bright Data billing is per GB, so **never proxy bulk-scraping endpoints** (full XML price dumps, archive downloads, etc.) — call out any large-payload endpoints in the proposal and keep them on direct egress with a separate scraping path.
- If the API works fine from non-Israeli egress, do **not** wire the proxy. The ~150–300 ms proxy hop is pure cost for no benefit.
- Add a comment above the conditional spread explaining *why* this specific client needs proxying, so future maintainers don't remove it.

### Step 1: Create the folder

Create `src/data-sources/{name}/` following the structure above.

### Step 2: Use shared schemas in tools

```typescript
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';

const inputSchema = z.object({
  id: z.string(),
  ...commonToolInput,  // adds searchedResourceName
});

const outputSchema = toolOutputSchema({
  items: z.array(z.object({ ... })),  // only success-specific fields
});
```

- `searchedResourceName` is **input-only** — never add it to output schemas
- `toolOutputSchema()` handles the discriminated union + error shape automatically
- `externalUrls` (apiUrl, portalUrl) is included in success/error via `commonSuccessOutput`

### Step 3: Configure source URL resolution

Source URLs are resolved via two mechanisms (both defined in `tools/index.ts`):

#### Standard: Declarative `sourceConfigs`

Most tools use `sourceConfigs` — just a Hebrew title. The registry auto-generates a resolver that reads `apiUrl` and `portalUrl` from the tool's output.

```typescript
// tools/index.ts
import type { ToolSourceConfig } from '@/data-sources/types';

export const mySourceConfigs: Partial<Record<MyToolName, ToolSourceConfig>> = {
  getMyData: { title: 'נתוני מקור' },
  searchMyData: { title: 'חיפוש במקור' },
};
```

#### Custom: `ToolSourceResolver<TInput, TOutput>` with typed schemas

For tools that need non-standard URL logic (e.g., building URLs from input fields), export a typed resolver from the `.tool.ts` file:

```typescript
// tools/my-tool.tool.ts
import type { ToolSourceResolver } from '@/data-sources/types';

export type MyToolInput = z.infer<typeof myToolInputSchema>;
export type MyToolOutput = z.infer<typeof myToolOutputSchema>;

export const resolveSourceUrl: ToolSourceResolver<MyToolInput, MyToolOutput> = (input, output) => {
  if (!output.success) return [];
  return [
    { url: buildMyUrl(input.id), title: `מקור — ${input.name}`, urlType: 'api' },
  ];
};
```

Key differences from standard configs:
- Returns `ToolSource[]` (array, not `| null`)
- Generic type params provide full type safety over input/output schemas
- Collected into `sourceResolvers` in the DataSourceDefinition (overrides `sourceConfigs` for the same tool)

### Step 4: Create translations with LucideIcon

`ToolTranslation` requires only `name` + `icon`. The optional `formatInput`/`formatOutput` fields are legacy and not used by the rendering pipeline.

```typescript
// {source}.translations.tsx
import { SearchIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';

export const translations: Partial<Record<ToolName, ToolTranslation>> = {
  myTool: {
    name: 'Hebrew name',
    icon: SearchIcon,       // LucideIcon component, NOT <SearchIcon />
  },
};
```

### Step 5: Create the DataSourceDefinition

```typescript
// index.ts
export const MyDataSource = {
  id: 'mySource',
  agent: { id: 'mySourceAgent', name: '...', description: '...', instructions: '...', createAgent },
  display: { label: '...', icon: MyIcon, badge: { ... } },
  routingHint: 'Hebrew description of when to route to this agent',
  tools: MySourceTools,
  sourceConfigs: mySourceConfigs,                      // declarative (standard tools)
  sourceResolvers: { toolA: resolveSourceUrlA },       // custom overrides only
  translations: myTranslations,
} satisfies DataSourceDefinition<typeof MySourceTools>;
```

### Step 6: Add suggestions (optional but recommended)

Add a `suggestions` config to your `DataSourceDefinition` with 2-4 Hebrew example prompts. These appear in the empty conversation UI, grouped by landing category tabs.

```typescript
suggestions: {
  prompts: [
    { label: 'Short Hebrew label', prompt: 'Full Hebrew prompt text', icon: SearchIcon },
    { label: 'Another label', prompt: 'Another prompt', icon: DatabaseIcon },
  ],
},
```

The suggestions are automatically picked up by `getDataSourcesWithSuggestions()` in the registry and displayed in `EmptyConversation` under the source's landing category tab (requires `landing` config to be set).

### Step 7: Register in registry

Add one import + spread in `src/data-sources/registry.ts`. The registry auto-wires:
- Agent into `dataSourceAgents`
- Tools into `allDataSourceTools`
- Translations (+ auto-generated `agent-*` entry) into `getAllTranslations()`
- Source resolvers into `resolveToolSourceUrl()`
- Routing hint into `buildRoutingHints()` (injected into routing agent prompt)
- Suggestions into `getDataSourcesWithSuggestions()` (for empty conversation UI)

### Step 8: Write contract tests (REQUIRED)

Create `{source}/__tests__/{source}-data-source.test.ts` with these checks:

```typescript
describe('{Source} data source contract', () => {
  it('satisfies DataSourceDefinition', () => {
    // TypeScript satisfies handles this, but verify at runtime too
    expect(MyDataSource.id).toBe('mySource');
    expect(MyDataSource.tools).toBeDefined();
    expect(MyDataSource.agent.createAgent).toBeTypeOf('function');
  });

  it('all translation keys exist in tools', () => {
    for (const key of Object.keys(MyDataSource.translations)) {
      expect(MyDataSource.tools).toHaveProperty(key);
    }
  });

  it('all sourceConfigs keys exist in tools', () => {
    for (const key of Object.keys(MyDataSource.sourceConfigs ?? {})) {
      expect(MyDataSource.tools).toHaveProperty(key);
    }
  });

  it('sourceConfigs have Hebrew title strings', () => {
    for (const config of Object.values(MyDataSource.sourceConfigs ?? {})) {
      expect(config.title).toBeTypeOf('string');
      expect(config.title.length).toBeGreaterThan(0);
    }
  });

  it('all sourceResolver keys exist in tools', () => {
    for (const key of Object.keys(MyDataSource.sourceResolvers ?? {})) {
      expect(MyDataSource.tools).toHaveProperty(key);
    }
  });

  it('agent factory returns correct ID', () => {
    const agent = MyDataSource.agent.createAgent('test/model');
    expect(agent.id).toBe('mySourceAgent');
  });

  it('source resolvers return empty array for failed output', () => {
    for (const resolver of Object.values(MyDataSource.sourceResolvers ?? {})) {
      expect(resolver({}, { success: false })).toEqual([]);
    }
  });

  it('no tool output schema includes searchedResourceName', () => {
    for (const tool of Object.values(MyDataSource.tools)) {
      const schema = tool.outputSchema;
      if (!schema) continue;
      // Verify searchedResourceName is not in output schema shape
      const parsed = schema.safeParse({ success: true, searchedResourceName: 'test' });
      // If it parses without searchedResourceName being required, that's fine
      // The point is it should NOT be a defined field
    }
  });
});
```

**Every new data source MUST have these contract tests.** They ensure the `DataSourceDefinition` interface is properly satisfied and prevent regressions.

### Step 9: Write API validation tests (REQUIRED)

Create `{source}/__tests__/{source}-api-validation.test.ts` — one file per sub-API folder (e.g., `health/tools/drugs/`, `health/tools/overview-data/`) or per general API folder. These tests hit **real external APIs** and validate that tool outputs match declared schemas.

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

Key rules:
- **One test per tool** — every tool in the data source must have a test case
- **Real APIs, not mocked** — the point is to catch schema drift when external APIs change
- **Both success and error are valid** — the test validates schema conformance, not data correctness
- **30s timeout** per test — external APIs can be slow
- **`describe.sequential`** — avoid concurrent requests to the same API host
- **Small limits** — use `maxResults: 3`, `limit: 3` to minimize API load
- **Excluded from default test run** — these files are excluded in `vitest.config.ts` and run on-demand via `npm run test:api`
- **Budget excluded** — MCP-based source has dynamic tools, no API validation tests needed

## MCPClient Pattern (Budget Source)

The budget source connects to a hosted MCP endpoint instead of defining custom Mastra tools. Tools are auto-discovered at agent creation time via `MCPClient.listTools()`.

```
src/data-sources/budget/
├── budget.mcp.ts              # MCPClient instance (url: https://next.obudget.org/mcp)
├── budget.agent.ts            # Async agent factory (await listTools() → new Agent)
├── budget.tools.ts            # Static tool name record (BudgetToolName type + BudgetToolNames)
├── budget.display.ts          # AgentDisplayInfo + badge config
├── budget.translations.tsx    # Hebrew tool translations
├── budget.source-resolvers.ts # Source URL resolvers
└── index.ts                   # Exports BudgetDataSource (no `satisfies` — tools are placeholders)
```

Key differences from standard sources:
- `createAgent` returns `Promise<Agent>` (async) — the `DataSourceDefinition.agent.createAgent` type is `(modelId: string) => Agent | Promise<Agent>`
- `tools` record contains placeholder values (`true`) for client-side registry key mapping — actual Tool objects come from MCP at runtime
- No `satisfies DataSourceDefinition<...>` — type safety for keys is enforced by the `BudgetToolName` type instead

## Landing Page Config

`DataSourceDefinition` has an optional `landing` field for landing page display:

```typescript
landing?: {
  logo: string;              // Path to SVG in /public
  description: string;       // Hebrew one-liner
  stats: { label: string; value: string; icon: LucideIcon }[];
  category: LandingCategory; // 'general' | 'economy' | 'health'
  order: number;             // Sort within category
}
```

Categories are defined in `display.types.ts` as `DATA_SOURCES_CATEGORIES`:
- `general` — "מידע כללי" (order 1) — datagov, govmap, knesset, cbs
- `economy` — "כלכלה ותקציב" (order 2) — budget, shufersal, rami-levy
- `health` — "בריאות" (order 3) — drugs, health

## Resource Extractors

Per-source `resourceExtractors` on `DataSourceDefinition` provide chip labels for ChainOfThought UI. Each extractor receives a tool's `(input, output)` and returns `{ name?: string; url?: string } | null`.

```typescript
resourceExtractors?: Partial<Record<keyof TTools & string, ToolResourceExtractor>>;
```

The registry aggregates all extractors via `getAllResourceExtractors()`. Sources that don't need custom extraction can omit the field (defaults to `{}`).

## Simplified ToolTranslation

The `ToolTranslation` interface requires only two fields:

```typescript
interface ToolTranslation {
  name: string;       // Hebrew display name
  icon: LucideIcon;   // Icon component for ChainOfThought UI
  // Optional legacy fields (not used by rendering pipeline):
  formatInput?: (input: unknown) => string | undefined;
  formatOutput?: (output: unknown) => string | undefined;
}
```

The `formatInput`/`formatOutput` fields are optional and no longer used by the UI. New data sources should only provide `name` and `icon`.

## Key Conventions

- `searchedResourceName` is **input-only** — never echo it in output schemas
- Translation icons are `LucideIcon` components, not JSX elements
- Use `toolOutputSchema({...successFields})` — don't repeat error shapes
- Source URLs use declarative `sourceConfigs` for standard tools; custom `sourceResolvers` only when non-standard URL logic is needed
- `DataSourceDefinition` is generic over `TTools` — keys in `sourceConfigs`, `sourceResolvers`, and `translations` are type-checked
- `routingHint` is auto-injected into the routing agent's system prompt via `buildRoutingHints()`
- `DataSource` type union: `'cbs' | 'datagov' | 'budget' | 'knesset' | 'govmap' | 'drugs' | 'health' | 'shufersal' | 'rami-levy'`
- Registry is split: `registry.ts` (client-safe) and `registry.server.ts` (server-only agent refs)
