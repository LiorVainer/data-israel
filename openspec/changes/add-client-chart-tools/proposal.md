# Change: Add Client-Side Chart Tools with Nivo

## Why

Users frequently query data that could be better visualized as charts (e.g., price comparisons, statistics, trends). Currently, the agent can only return text/tabular data. Adding client-side charting capability will:

1. Improve data comprehension with visual representations
2. Allow the AI agent to intelligently decide when data is chart-worthy
3. Provide interactive visualizations using Nivo library

## What Changes

- **ADDED**: New `displayChart` client-side tool (no `execute` parameter) for rendering charts
- **ADDED**: `ChartType` enum with supported chart types: `bar`, `line`, `pie`
- **ADDED**: `useChat` integration with `onToolCall` handler for client-side chart rendering
- **ADDED**: `ChartRenderer` component using Nivo library (`@nivo/bar`, `@nivo/line`, `@nivo/pie`)
- **ADDED**: Chart data transformation utilities to convert query results to Nivo-compatible formats
- **MODIFIED**: `page.tsx` to include chart rendering via `onToolCall` callback
- **ADDED**: NPM dependencies: `@nivo/bar`, `@nivo/line`, `@nivo/pie`, `@nivo/core`

## Impact

- **Affected specs**: `client-tools` (new capability)
- **Affected code**:
  - `lib/tools/display-chart.ts` - New tool definition
  - `components/chat/ChartRenderer.tsx` - Nivo chart component
  - `app/page.tsx` - `useChat` with `onToolCall` handler
  - `agents/data-agent.ts` - Tool export (for type inference only)
- **Dependencies**: Adds ~150KB bundle size for Nivo charts
- **Breaking changes**: None (additive change)

## Technical Approach

### Client-Side Tool Pattern (AI SDK v6)

Per AI SDK docs, client-side tools are defined **without** an `execute` function:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const displayChart = tool({
  description: 'Display data as an interactive chart when visual representation would help user understanding',
  parameters: z.object({
    chartType: z.enum(['bar', 'line', 'pie']),
    data: z.array(z.record(z.string(), z.unknown())),
    config: z.object({
      title: z.string().optional(),
      indexKey: z.string(),
      valueKeys: z.array(z.string()),
      // ... chart-specific config
    }),
  }),
  // NO execute - handled client-side
});
```

### Client-Side Handling

The `useChat` hook handles the tool call via `onToolCall`:

```tsx
const { messages, sendMessage, addToolOutput } = useChat({
  async onToolCall({ toolCall }) {
    if (toolCall.toolName === 'displayChart') {
      // Render chart and return success
      addToolOutput({
        tool: 'displayChart',
        toolCallId: toolCall.toolCallId,
        output: { rendered: true },
      });
    }
  },
});
```

### Nivo Chart Components

Using `ResponsiveBar`, `ResponsiveLine`, `ResponsivePie` for automatic sizing:

```tsx
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
```

## References

- AI SDK Client Tools: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage
- AI SDK onToolCall: https://ai-sdk.dev/docs/troubleshooting/tool-invocation-missing-result
- Nivo Charts: https://nivo.rocks/
