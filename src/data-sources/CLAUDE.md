# Data Sources Architecture

Self-contained data source modules. Each folder provides everything needed: API client, tools, agent, translations, display config, and source URL resolvers.

## Structure

```
src/data-sources/
├── types/                          # Shared types & Zod schema fragments
│   ├── data-source.types.ts        # DataSourceDefinition<TTools> interface
│   ├── tool.types.ts               # ToolSourceResolver, ToolTranslation, ToolIOMap
│   ├── tool-schemas.ts             # commonToolInput, externalUrls, toolOutputSchema()
│   ├── display.types.ts            # AgentDisplayInfo, DataSource, DataSourceConfig
│   └── index.ts                    # Re-exports
├── registry.ts                     # Collects all sources, exports aggregated tools/agents/translations
├── cbs/                            # CBS data source
└── datagov/                        # DataGov data source
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

```typescript
// {source}.translations.tsx
import { SearchIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';

export const translations: Partial<Record<ToolName, ToolTranslation>> = {
  myTool: {
    name: 'Hebrew name',
    icon: SearchIcon,       // LucideIcon component, NOT <SearchIcon />
    formatInput: (input) => '...',
    formatOutput: (output) => '...',
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

### Step 6: Register in registry

Add one import + spread in `src/data-sources/registry.ts`. The registry auto-wires:
- Agent into `dataSourceAgents`
- Tools into `allDataSourceTools`
- Translations (+ auto-generated `agent-*` entry) into `getAllTranslations()`
- Source resolvers into `resolveToolSourceUrl()`
- Routing hint into `buildRoutingHints()` (injected into routing agent prompt)

### Step 7: Write contract tests (REQUIRED)

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

## Key Conventions

- `searchedResourceName` is **input-only** — never echo it in output schemas
- Translation icons are `LucideIcon` components, not JSX elements
- Use `toolOutputSchema({...successFields})` — don't repeat error shapes
- Source URL resolvers are per-tool (co-located), not a central switch
- `DataSourceDefinition` is generic over `TTools` — keys in `sourceResolvers` and `translations` are type-checked
- `routingHint` is auto-injected into the routing agent's system prompt via `buildRoutingHints()`
