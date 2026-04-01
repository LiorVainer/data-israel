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
│   ├── {tool-name}.tool.ts         # Tool def + optional resolveSourceUrl export
│   └── index.ts                    # {Source}Tools object + {Source}ToolName type
├── __tests__/
│   └── {source}-data-source.test.ts # Contract tests (REQUIRED)
├── {source}.agent.ts               # Agent factory + system prompt instructions
├── {source}.translations.tsx       # Hebrew tool translations (LucideIcon, not JSX)
├── {source}.display.ts             # AgentDisplayInfo + badge config
└── index.ts                        # Exports {Source}DataSource satisfies DataSourceDefinition
```

## Adding a New Data Source

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

### Step 3: Co-locate source URL resolvers

In each `.tool.ts` that generates source URLs, export a resolver:

```typescript
export const resolveSourceUrl: ToolSourceResolver = (input, output) => {
  const apiUrl = getString(output, 'apiUrl');
  if (!apiUrl) return null;
  return { url: apiUrl, title: '...', urlType: 'api' };
};
```

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
  sourceResolvers: { toolA: resolveSourceUrlA },
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

  it('all sourceResolver keys exist in tools', () => {
    for (const key of Object.keys(MyDataSource.sourceResolvers)) {
      expect(MyDataSource.tools).toHaveProperty(key);
    }
  });

  it('agent factory returns correct ID', () => {
    const agent = MyDataSource.agent.createAgent('test/model');
    expect(agent.id).toBe('mySourceAgent');
  });

  it('source resolvers return null for failed output', () => {
    for (const resolver of Object.values(MyDataSource.sourceResolvers)) {
      expect(resolver({}, { success: false })).toBeNull();
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
  category: LandingCategory; // 'government' | 'economy' | 'health'
  order: number;             // Sort within category
}
```

Categories are defined in `display.types.ts` as `LANDING_CATEGORIES`:
- `government` — "ממשל ותקציב" (order 1)
- `economy` — "כלכלה ונדל\"ן" (order 2)
- `health` — "בריאות" (order 3)

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
- Source URL resolvers are per-tool (co-located), not a central switch
- `DataSourceDefinition` is generic over `TTools` — keys in `sourceResolvers` and `translations` are type-checked
- `routingHint` is auto-injected into the routing agent's system prompt via `buildRoutingHints()`
- `DataSource` type union: `'cbs' | 'datagov' | 'budget' | 'knesset' | 'govmap' | 'drugs' | 'health' | 'shufersal' | 'rami-levy'`
- Registry is split: `registry.ts` (client-safe) and `registry.server.ts` (server-only agent refs)
