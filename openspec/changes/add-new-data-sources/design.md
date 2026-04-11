# Design: Add New Data Sources

## Architecture Overview

```
src/data-sources/
├── types/
│   ├── data-source.types.ts    # DataSourceDefinition + landing config
│   ├── tool.types.ts           # Simplified ToolTranslation (name + icon only)
│   ├── display.types.ts        # LANDING_CATEGORIES, LandingCategory, DataSource union
│   └── ...
├── registry.ts                 # Auto-wires all sources
├── budget/                     # NEW — MCPClient (hosted)
├── knesset/                    # NEW — Custom OData tools
├── nadlan/                     # NEW — Custom REST tools
├── drugs/                      # NEW — Custom REST tools
├── health/                     # NEW — Custom REST tools
├── grocery/                    # NEW — Custom XML/REST tools
├── cbs/                        # Existing
└── datagov/                    # Existing
```

## Landing Categories (Single Source of Truth)

```typescript
// src/data-sources/types/display.types.ts

export const LANDING_CATEGORIES = {
  government: { label: 'ממשל ותקציב', order: 1 },
  economy:    { label: 'כלכלה ונדל"ן', order: 2 },
  health:     { label: 'בריאות', order: 3 },
} as const;

export type LandingCategory = keyof typeof LANDING_CATEGORIES;
```

Category assignments:
- `government` → data.gov.il, BudgetKey, Knesset
- `economy` → CBS, Nadlan, Grocery Prices
- `health` → Israel Drugs, IL Health

## DataSourceDefinition Changes

### New `landing` field
```typescript
interface DataSourceDefinition<TTools> {
  // ... existing fields ...
  landing?: {
    logo: string;                    // Path to logo SVG in /public
    description: string;             // Hebrew one-liner
    stats: { label: string; value: string; icon: LucideIcon }[];
    category: LandingCategory;       // keyof typeof LANDING_CATEGORIES
    order: number;                   // Sort order within category
  };
}
```

### New `extractResource` field
```typescript
interface DataSourceDefinition<TTools> {
  // ... existing fields ...
  /** Per-tool resource extractors for AgentInternalCallsChain chips */
  resourceExtractors: Partial<Record<keyof TTools & string, ToolResourceExtractor>>;
}

type ToolResourceExtractor = (input: unknown, output: unknown) => { name?: string; url?: string } | null;
```

This replaces the hardcoded `extractToolResource()` in `ToolCallParts.tsx`.

### Simplified ToolTranslation
```typescript
// BEFORE
interface ToolTranslation {
  name: string;
  icon: LucideIcon;
  formatInput: (input: unknown) => string | undefined;   // REMOVE
  formatOutput: (output: unknown) => string | undefined;  // REMOVE
}

// AFTER
interface ToolTranslation {
  name: string;
  icon: LucideIcon;
}
```

## MCPClient Integration Pattern (BudgetKey)

```typescript
// src/data-sources/budget/budget.mcp.ts
import { MCPClient } from '@mastra/mcp';

export const budgetMcpClient = new MCPClient({
  id: 'budgetkey',
  servers: {
    budgetkey: {
      url: new URL('https://next.obudget.org/mcp'),
    },
  },
});
```

```typescript
// src/data-sources/budget/budget.agent.ts
export function createBudgetAgent(modelId: string) {
  return new Agent({
    id: 'budgetAgent',
    name: 'סוכן תקציב המדינה',
    instructions: BUDGET_INSTRUCTIONS,
    model: getAiSdkModelId(modelId),
    tools: await budgetMcpClient.listTools(),
  });
}
```

MCPClient tool names are `budgetkey_DatasetInfo`, `budgetkey_DatasetFullTextSearch`, `budgetkey_DatasetDBQuery`. Translations register these namespaced names.

## Landing Page — SourcesSection Refactor

```tsx
// src/components/landing/SourcesSection.tsx
<Tabs defaultValue="government" dir="rtl">
  <TabsList>
    {sortedCategories.map(([id, cat]) => (
      <TabsTrigger key={id} value={id}>{cat.label}</TabsTrigger>
    ))}
  </TabsList>
  {sortedCategories.map(([id]) => (
    <TabsContent key={id} value={id}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sourcesInCategory.map(source => (
          <SourceCard key={source.id} {...source.landing} url={source.display.badge.url} />
        ))}
      </div>
    </TabsContent>
  ))}
</Tabs>
```

SourceCard is a new, smaller component replacing the current SourceBlock pattern.

## Dead Code Removal & Relocation

| File | Action |
|------|--------|
| `src/components/chat/MessageToolCalls.tsx` | **Move** `getToolInfo()` to `src/lib/utils/tool-info.ts`, then **delete** entire file (remaining code is dead: `MessageToolCalls` component, `getToolDescription`, `getToolIO`, `ToolIO`) |
| `src/components/chat/ToolCallCard.tsx` | **Delete** entire file (unused) |
| `src/components/chat/index.ts` | Remove dead exports, re-export `getToolInfo` from new location if needed |
| `src/data-sources/*/translations.tsx` | Remove `formatInput`/`formatOutput` from all translations |
| `src/data-sources/types/tool.types.ts` | Remove `formatInput`/`formatOutput` from `ToolTranslation` interface |

`getToolInfo()` is a pure utility (translations lookup → name + icon) used by 3 chat components. It belongs in `src/lib/utils/`, not in a dead component file.

## DataSource Union Update

```typescript
// BEFORE
export type DataSource = 'cbs' | 'datagov';

// AFTER
export type DataSource = 'cbs' | 'datagov' | 'budget' | 'knesset' | 'nadlan' | 'drugs' | 'health' | 'grocery';
```

## Implementation Priority

1. **Phase 0**: ToolTranslation cleanup + dead code removal (unblocks all phases)
2. **Phase 1**: BudgetKey via MCPClient (fastest — hosted MCP, zero API code)
3. **Phase 2**: Knesset (TypeScript reference code, OData)
4. **Phase 3**: Nadlan (high demand, REST)
5. **Phase 4**: Israel Drugs + IL Health (health agent, REST)
6. **Phase 5**: Grocery Prices (highest complexity — XML parsing)
7. **Phase 6**: Landing page refactor (config-driven Tabs + cards)
8. **Phase 7**: Documentation updates (README.md, CLAUDE.md files)
