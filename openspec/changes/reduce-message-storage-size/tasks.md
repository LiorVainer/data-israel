## 0. Install es-toolkit

- [x] 0.1 Install `es-toolkit` via pnpm

  ```bash
  pnpm add es-toolkit
  ```

  Key functions we'll use: `pick`, `mapValues` — both tree-shakeable and type-safe.

## 1. Create shared constants and types

- [x] 1.1 Create `constants/tool-result-fields.ts`

  > Single source of truth for which fields are preserved from sub-agent tool results.
  > When adding a new field the UI needs, update this file — all consumers import from here.
  > Consumers: `truncate-tool-results.processor.ts`, `app/api/chat/route.ts`
  > UI readers: `ToolCallParts.tsx`, `source-url-resolvers.ts`, `AgentInternalCallsChain.tsx`

  ```typescript
  /**
   * Tool Result Field Constants
   *
   * Defines which fields from sub-agent tool results are preserved
   * when stripping large data for storage/UI replay.
   */

  // ── Tool result output fields (from tool execute() return values) ──

  /** Scalar fields preserved from tool result objects */
  export const TOOL_RESULT_KEEP_FIELDS = [
      'success',
      'error',
      'searchedResourceName',
      'apiUrl',
      'portalUrl',
      'total',
  ] as const;

  export type ToolResultKeepField = (typeof TOOL_RESULT_KEEP_FIELDS)[number];

  /** Nested object fields — only these sub-keys are preserved */
  export const TOOL_RESULT_KEEP_NESTED = {
      dataset: ['title', 'name'] as const,
      organization: ['title', 'name'] as const,
      resource: ['name'] as const,
  } satisfies Record<string, readonly string[]>;

  export type ToolResultNestedKey = keyof typeof TOOL_RESULT_KEEP_NESTED;

  // ── Tool call args fields (from tool input schemas) ──

  /** Fields preserved from tool call args (inputs) */
  export const TOOL_ARGS_KEEP_FIELDS = [
      'searchedResourceName',
      'q',
  ] as const;

  export type ToolArgsKeepField = (typeof TOOL_ARGS_KEEP_FIELDS)[number];

  // ── Chart data limits ──

  export const CHART_MAX_DATA_POINTS = {
      bar: 30,
      line: 50,
      pie: 15,
  } as const;

  // ── Query limits ──

  export const QUERY_MAX_FIELDS = 30;
  ```

## 2. Create the processor

- [x] 2.1 Create `agents/processors/truncate-tool-results.processor.ts`

  **Message shape** (from existing `ToolResultSummarizerProcessor`):
  - `messages` is `MastraDBMessage[]` from `@mastra/core/agent/message-list`
  - Tool results: `msg.content.toolInvocations` array
  - Each invocation: `{ state: 'result'|'call'|..., toolName, toolCallId, result }`

  Use `pick` from `es-toolkit` for type-safe field extraction:

  ```typescript
  import type { Processor } from '@mastra/core/processors';
  import type { MastraDBMessage } from '@mastra/core/agent/message-list';
  import { pick } from 'es-toolkit';
  import {
      TOOL_RESULT_KEEP_FIELDS,
      TOOL_RESULT_KEEP_NESTED,
      type ToolResultNestedKey,
  } from '@/constants/tool-result-fields';

  /**
   * Strip a tool result to only UI-required fields.
   * Exported for reuse in enrichWithSubAgentData (safety net).
   */
  export function stripToolResult(result: Record<string, unknown>): Record<string, unknown> {
      // Pick scalar fields
      const stripped = pick(result, [...TOOL_RESULT_KEEP_FIELDS]);

      // Pick nested object sub-fields (dataset.title, organization.name, etc.)
      for (const [key, allowedKeys] of Object.entries(TOOL_RESULT_KEEP_NESTED)) {
          const nested = result[key];
          if (typeof nested === 'object' && nested !== null) {
              stripped[key] = pick(nested as Record<string, unknown>, [...allowedKeys]);
          }
      }

      return stripped;
  }

  export class TruncateToolResultsProcessor implements Processor {
      readonly id = 'truncate-tool-results';

      async processOutputResult({
          messages,
      }: {
          messages: MastraDBMessage[];
          abort: (reason?: string) => never;
      }): Promise<MastraDBMessage[]> {
          for (const msg of messages) {
              if (msg.role !== 'assistant') continue;
              const invocations = msg.content?.toolInvocations;
              if (!Array.isArray(invocations)) continue;
              for (const inv of invocations) {
                  if (inv.state === 'result' && inv.result != null && typeof inv.result === 'object') {
                      inv.result = stripToolResult(inv.result as Record<string, unknown>);
                  }
              }
          }
          return messages;
      }
  }
  ```

  **Note on `pick` usage:** `es-toolkit/pick` requires a mutable string array, so spread the `as const` arrays: `[...TOOL_RESULT_KEEP_FIELDS]`. Verify the exact signature — may need `pick(obj, keys)` where keys is `string[]`.

- [x] 2.2 Register on datagovAgent in `agents/network/datagov/data-gov.agent.ts`

  ```typescript
  import { TruncateToolResultsProcessor } from '../../processors/truncate-tool-results.processor';

  export function createDatagovAgent(modelId: string): Agent {
      return new Agent({
          // ... existing config (already has inputProcessors) ...
          outputProcessors: [new TruncateToolResultsProcessor()],
      });
  }
  ```

- [x] 2.3 Register on cbsAgent in `agents/network/cbs/cbs.agent.ts` — same pattern

## 3. Strip tool results in enrichment (safety net for existing data)

- [x] 3.1 Add stripping in `app/api/chat/route.ts` above `enrichWithSubAgentData`

  ```typescript
  import { stripToolResult } from '@/agents/processors/truncate-tool-results.processor';
  import { TOOL_ARGS_KEEP_FIELDS } from '@/constants/tool-result-fields';
  import { pick } from 'es-toolkit';

  function stripToolArgs(args: Record<string, unknown>): Record<string, unknown> {
      return pick(args, [...TOOL_ARGS_KEEP_FIELDS]);
  }
  ```

- [x] 3.2 Apply in `enrichWithSubAgentData` toolCalls/toolResults collection (~lines 153-166)

  ```typescript
  // toolCalls (line ~156):
  args: stripToolArgs((tp.input ?? {}) as Record<string, unknown>),

  // toolResults (line ~164):
  result: stripToolResult((tp.output ?? {}) as Record<string, unknown>),
  ```

## 4. Cap chart data schemas

File: `lib/tools/client/display-chart.ts`

```typescript
import { CHART_MAX_DATA_POINTS } from '@/constants/tool-result-fields';
```

- [x] 4.1 Bar chart — add `.max(CHART_MAX_DATA_POINTS.bar)` to data array (line ~23)
- [x] 4.2 Line chart — add `.max(CHART_MAX_DATA_POINTS.line)` to outer data array (line ~98)
- [x] 4.3 Pie chart — add `.max(CHART_MAX_DATA_POINTS.pie)` to data array (line ~173)

## 5. Cap fields in queryDatastoreResource

File: `lib/tools/datagov/query-datastore-resource.ts`

- [x] 5.1 Cap fields using constant (line ~118)

  ```typescript
  import { QUERY_MAX_FIELDS } from '@/constants/tool-result-fields';

  fields: result.fields.slice(0, QUERY_MAX_FIELDS).map((f) => ({ name: f.id, type: f.type })),
  ```

## 6. Verification

- [x] 6.1 Run `tsc`, `npm run build`
- [ ] 6.2 Test loading existing crashing thread — no stack overflow
- [ ] 6.3 Test new query — charts render, tool timeline shows resource names + success/error, source URL chips work
