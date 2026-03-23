# Design: Unify Data Source Architecture

## Architecture Overview

```
src/data-sources/
├── types/                              # Shared type definitions
│   ├── index.ts                        # Re-exports all types
│   ├── data-source.types.ts            # DataSourceDefinition<TTools>, DataSourceId
│   ├── tool.types.ts                   # ToolSourceResolver, ToolTranslation,
│   │                                   #   ToolIOMap, ToolName, ToolInput<T>, ToolOutput<T>
│   ├── tool-schemas.ts                 # Shared Zod fragments (runtime):
│   │                                   #   commonToolInput, externalUrls,
│   │                                   #   commonSuccessOutput, commonErrorOutput,
│   │                                   #   toolOutputSchema()
│   └── display.types.ts               # AgentDisplayInfo, DataSource, DataSourceConfig
│
├── registry.ts                         # Central registry:
│                                       #   allDataSourceTools, dataSourceAgents,
│                                       #   allTranslations, resolveToolSourceUrl(),
│                                       #   getToolDataSource(), DataSourceId
│
├── cbs/                                # CBS data source (self-contained)
│   ├── api/
│   │   ├── cbs.client.ts              # Axios instances, retry logic, XML fallback
│   │   ├── cbs.types.ts               # CBS API response types
│   │   └── cbs.endpoints.ts           # Base URLs, path builders
│   ├── tools/
│   │   ├── series/
│   │   │   ├── browse-cbs-catalog.tool.ts
│   │   │   ├── browse-cbs-catalog-path.tool.ts
│   │   │   ├── get-cbs-series-data.tool.ts
│   │   │   └── get-cbs-series-data-by-path.tool.ts
│   │   ├── price/
│   │   │   ├── browse-cbs-price-indices.tool.ts
│   │   │   ├── get-cbs-price-data.tool.ts
│   │   │   └── calculate-cbs-price-index.tool.ts
│   │   ├── dictionary/
│   │   │   └── search-cbs-localities.tool.ts
│   │   ├── source/
│   │   │   └── generate-source-url.tool.ts
│   │   └── index.ts                   # CbsTools object + CbsToolName type
│   ├── cbs.agent.ts                   # Agent factory + instructions (merged)
│   ├── cbs.translations.tsx           # Hebrew tool translations (CBS only)
│   ├── cbs.display.ts                 # AgentDisplayInfo + badge config
│   └── index.ts                       # Exports CbsDataSource satisfies DataSourceDefinition
│
├── datagov/                            # DataGov data source (self-contained)
│   ├── api/
│   │   ├── datagov.client.ts          # Axios instance, response unwrapping
│   │   ├── datagov.types.ts           # CKAN API response types
│   │   └── datagov.endpoints.ts       # Base URLs, portal URL builders
│   ├── tools/
│   │   ├── search-datasets.tool.ts
│   │   ├── list-all-datasets.tool.ts
│   │   ├── get-dataset-details.tool.ts
│   │   ├── get-dataset-activity.tool.ts
│   │   ├── get-dataset-schema.tool.ts
│   │   ├── list-organizations.tool.ts
│   │   ├── get-organization-details.tool.ts
│   │   ├── get-organization-activity.tool.ts
│   │   ├── list-groups.tool.ts
│   │   ├── list-tags.tool.ts
│   │   ├── search-resources.tool.ts
│   │   ├── get-resource-details.tool.ts
│   │   ├── query-datastore-resource.tool.ts
│   │   ├── get-status.tool.ts
│   │   ├── list-licenses.tool.ts
│   │   ├── generate-source-url.tool.ts
│   │   └── index.ts                   # DataGovTools object + DataGovToolName type
│   ├── datagov.agent.ts               # Agent factory + instructions (merged)
│   ├── datagov.translations.tsx       # Hebrew tool translations (DataGov only)
│   ├── datagov.display.ts             # AgentDisplayInfo + badge config
│   └── index.ts                       # Exports DataGovDataSource satisfies DataSourceDefinition

src/agents/                             # Mastra infrastructure (stays)
├── mastra.ts                           # { routingAgent, ...dataSourceAgents }
├── config.ts                           # Shared agent config (memory, display limits)
├── types.ts                            # AgentName, AppUITools, AppUIMessage
├── model.ts                            # getMastraModelId (moved from network/model.ts)
├── evals/                              # Eval config + scorers
├── processors/                         # Input/output processors
│   ├── truncate-tool-results.processor.ts  # Keep-field constants inlined
│   └── ...
└── routing/                            # Routing agent (orchestrator)
    └── routing.agent.ts

src/lib/tools/
└── client/                             # Client tools (not a data source)
    ├── display-chart.tool.ts           # CHART_MAX_DATA_POINTS inlined
    ├── suggest-follow-ups.tool.ts
    ├── translations.tsx
    └── index.ts
```

## Core Interface

```typescript
// src/data-sources/types/data-source.types.ts

import type { Agent } from '@mastra/core/agent';
import type { Tool } from '@mastra/core/tools';
import type { ToolSourceResolver, ToolTranslation } from './tool.types';
import type { DataSourceConfig } from './display.types';
import type { LucideIcon } from 'lucide-react';

export interface DataSourceDefinition<
  TTools extends Record<string, Tool<any, any, any, any, any, any, any>>
> {
  /** Unique key — 'cbs' | 'datagov' | future sources */
  id: string;

  /** Agent configuration */
  agent: {
    /** Agent ID used in Mastra registration (e.g., 'cbsAgent') */
    id: string;
    /** Hebrew display name */
    name: string;
    /** English description for Mastra agent routing */
    description: string;
    /** System prompt / instructions */
    instructions: string;
    /** Factory function to create agent with a specific model */
    createAgent: (modelId: string) => Agent;
  };

  /** UI display metadata */
  display: {
    /** Hebrew label shown in ChainOfThought UI */
    label: string;
    /** Icon component for agent display */
    icon: LucideIcon;
    /** Badge configuration for data source attribution */
    badge: DataSourceConfig;
  };

  /** Routing hint — Hebrew description of when to delegate to this agent.
   *  Auto-injected into routing agent's system prompt by the registry. */
  routingHint: string;

  /** All Mastra tools for this data source */
  tools: TTools;

  /** Per-tool source URL resolvers (keys must be tool names from TTools) */
  sourceResolvers: Partial<Record<keyof TTools & string, ToolSourceResolver>>;

  /** Per-tool Hebrew translations (keys must be tool names from TTools) */
  translations: Partial<Record<keyof TTools & string, ToolTranslation>>;
}
```

## Shared Zod Schemas

```typescript
// src/data-sources/types/tool-schemas.ts

import { z } from 'zod';

/** Common input fields shared by all data tools */
export const commonToolInput = {
  searchedResourceName: z.string()
    .describe('Hebrew label for UI display. Use the title from search results.'),
};

/** External URL fields — extensible for future URL types */
export const externalUrls = {
  apiUrl: z.string().optional().describe('Direct API endpoint URL'),
  portalUrl: z.string().optional().describe('Human-readable page on the data source website'),
};

/** Common fields in success output */
export const commonSuccessOutput = {
  success: z.literal(true) as z.ZodLiteral<true>,
  ...externalUrls,
};

/** Common error output shape */
export const commonErrorOutput = z.object({
  success: z.literal(false),
  error: z.string(),
  ...externalUrls,
});

/**
 * Helper to build a discriminated union output schema.
 * Merges success-specific fields with common success/error shapes.
 *
 * @example
 * const outputSchema = toolOutputSchema({
 *   items: z.array(z.object({ name: z.string() })),
 *   totalItems: z.number(),
 * });
 */
export function toolOutputSchema<T extends z.ZodRawShape>(successFields: T) {
  return z.discriminatedUnion('success', [
    z.object({ ...commonSuccessOutput, ...successFields }),
    commonErrorOutput,
  ]);
}
```

## Registry Design

```typescript
// src/data-sources/registry.ts (conceptual)

import { CbsDataSource } from './cbs';
import { DataGovDataSource } from './datagov';

// All registered data sources
const DATA_SOURCES = [CbsDataSource, DataGovDataSource] as const;

// Typed agents const for mastra.ts
export const dataSourceAgents = {
  [CbsDataSource.agent.id]: /* lazy or pre-built agent */,
  [DataGovDataSource.agent.id]: /* lazy or pre-built agent */,
} as const;

// Merged tools for type derivation
export const allDataSourceTools = {
  ...CbsDataSource.tools,
  ...DataGovDataSource.tools,
} as const;

// DataSourceId union derived from registered sources
export type DataSourceId = (typeof DATA_SOURCES)[number]['id'];

// Auto-generated routing hints for the routing agent's system prompt
export function buildRoutingHints(): string {
  return DATA_SOURCES
    .map(ds => `- ${ds.agent.id}: ${ds.routingHint}`)
    .join('\n');
}

// Merged translations (per-source + auto-generated agent-* entries)
export function getAllTranslations() { ... }

// Source URL resolution (map lookup, no switch)
export function resolveToolSourceUrl(toolType, input, output) { ... }

// Tool → data source lookup
export function getToolDataSource(toolKey) { ... }
```

## Tool File Pattern (with co-located resolver)

```typescript
// src/data-sources/cbs/tools/series/get-cbs-series-data.tool.ts

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';
import { cbsApi } from '../../api/cbs.client';

const inputSchema = z.object({
  id: z.string().describe('Series ID(s)'),
  ...commonToolInput,
});

const outputSchema = toolOutputSchema({
  series: z.array(z.object({
    id: z.string(),
    observations: z.array(z.object({ ... })),
  })),
});

export const getCbsSeriesData = createTool({
  id: 'getCbsSeriesData',
  description: '...',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => { ... },
});

/** Source URL resolver — co-located with the tool that produces the data */
export const resolveSourceUrl: ToolSourceResolver = (input, output) => {
  const apiUrl = getString(output, 'apiUrl');
  if (!apiUrl) return null;
  const name = getString(input, 'searchedResourceName');
  return {
    url: apiUrl,
    title: name ?? 'סדרה סטטיסטית - הלמ"ס',
    urlType: 'api',
  };
};
```

## Translation Pattern

```typescript
// src/data-sources/cbs/cbs.translations.tsx

import { DatabaseIcon, BarChart2Icon, ... } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { CbsToolName } from './tools';

export const cbsTranslations: Partial<Record<CbsToolName, ToolTranslation>> = {
  browseCbsCatalog: {
    name: 'חיפוש בנושאי הלמ"ס',
    icon: DatabaseIcon,  // LucideIcon component, not JSX
    formatInput: (input) => { ... },
    formatOutput: (output) => { ... },
  },
  // ...
};
```

## What Changes for Existing Consumers

| Consumer | Before | After |
|----------|--------|-------|
| `mastra.ts` | Manual `{ routingAgent, cbsAgent, datagovAgent }` | `{ routingAgent, ...dataSourceAgents }` |
| `AgentModelConfig` | Hardcoded `{ routing, datagov, cbs }` | `{ routing } & Record<DataSourceId, string>` |
| `ToolIOMap` / `AllToolObjects` | Manual `typeof CbsTools & typeof DataGovTools` | `typeof allDataSourceTools` |
| `getToolDataSource()` | Manual Set checks | Registry map lookup |
| `resolveToolSourceUrl()` | Giant switch | Registry map lookup |
| `toolTranslations` | Single 580-line file | Per-source files + auto agent-* |
| `AgentsDisplayMap` | Manual Record | Derived from data source `display` |
| `toolIconMap` | Separate map in component | From translations (icon is LucideIcon) |
| `MessageToolCalls.getToolInfo()` | Reads `toolTranslations` + `toolIconMap` | Reads unified registry translations |

## Adding a New Data Source (Future)

1. Create `src/data-sources/{name}/` with api/, tools/, agent, translations, display, index (includes `routingHint`)
2. Add one import + spread in `registry.ts`

**2 touch points instead of 16.** The routing agent prompt auto-includes the new agent via `buildRoutingHints()`.
