# Design: Client-Side Chart Tools

## Context

The data.gov.il AI agent queries open data that often includes numerical/statistical information. Visual representation through charts improves user comprehension significantly. We need to implement chart rendering using AI SDK v6's tool pattern and Nivo for visualization.

### Constraints

- **AI SDK v6**: Uses ToolLoopAgent which requires `execute` functions for all tools
- **Next.js 16**: Client components with `'use client'` directive
- **Hebrew RTL**: Charts must support RTL text for Hebrew labels
- **Bundle size**: Minimize impact by using specific Nivo packages (not full bundle)

## Goals / Non-Goals

### Goals

- Provide interactive chart visualization for query results
- Support bar, line, and pie charts (cover 90% of use cases)
- AI agent intelligently decides when data is chart-worthy
- Charts render inline with conversation messages
- Full TypeScript type safety for chart data

### Non-Goals

- Real-time streaming chart updates (charts render on completion)
- Chart export/download functionality (future enhancement)
- Advanced chart types (scatter, heatmap, etc.)
- Chart customization UI (colors are automatic)

## Decisions

### Decision 1: Nivo over other libraries

**Choice**: Use Nivo (`@nivo/bar`, `@nivo/line`, `@nivo/pie`)

**Alternatives considered**:
- **Chart.js/react-chartjs-2**: Imperative API, less React-native
- **Recharts**: Good but less polished default styling
- **Victory**: Good but larger bundle, more verbose API
- **D3 direct**: Too low-level for this use case

**Rationale**: Nivo provides:
- Declarative React components
- Beautiful default styling
- SSR support (matches Next.js patterns)
- Excellent TypeScript support
- Responsive components out of the box

### Decision 2: Three separate tools instead of one unified tool

**Choice**: Define `displayBarChart`, `displayLineChart`, `displayPieChart` as separate tools

**Alternatives considered**:
- Single `displayChart` tool with discriminated union schema

**Rationale**:
- Each tool has its own specific schema (no union complexity)
- Better type safety and clearer error messages
- Agent can be more precise about which chart to use
- Simpler schema validation per chart type

### Decision 3: Tools must have `execute` function

**Choice**: All chart tools have server-side `execute` functions that return acknowledgment

**Key Learning**: ToolLoopAgent only sends tools WITH `execute` functions to the model. Tools without `execute` are simply not included in the model's tool list.

**Rationale**:
- Without `execute`, the tool never gets invoked (model outputs it as text)
- The `execute` function returns simple acknowledgment `{ rendered: true, chartType, title }`
- Actual chart rendering happens client-side via `message.parts`

### Decision 4: Chart data format

**Choice**: Use Nivo-native data formats in tool parameters

**Rationale**: Direct Nivo format:
- Eliminates transformation bugs
- Better type safety (Zod validates Nivo shape)
- Agent can be instructed on exact format
- Simplifies ChartRenderer implementation

## Component Architecture

**Key Pattern: Message Parts Rendering**

AI SDK v6 exposes tool calls as typed parts in `message.parts[]`. The tool part type is `tool-{toolName}`, so:
- `displayBarChart` → `part.type === 'tool-displayBarChart'`
- `displayLineChart` → `part.type === 'tool-displayLineChart'`
- `displayPieChart` → `part.type === 'tool-displayPieChart'`

```
┌─────────────────────────────────────────────────────────────┐
│ agents/data-agent.ts                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ const agentTools = {                                    │ │
│ │   displayBarChart,   // has execute function            │ │
│ │   displayLineChart,  // has execute function            │ │
│ │   displayPieChart,   // has execute function            │ │
│ │   ...                                                   │ │
│ │ }                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tool execute() returns:                                 │ │
│ │ { rendered: true, chartType: 'bar', title: '...' }      │ │
│ │ (Actual rendering happens client-side via parts)        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ components/chat/MessageItem.tsx                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ message.parts.map(part => {                             │ │
│ │   switch (part.type) {                                  │ │
│ │     case 'text':                                        │ │
│ │       return <TextMessagePart />;                       │ │
│ │     case 'tool-displayBarChart':                        │ │
│ │     case 'tool-displayLineChart':                       │ │
│ │     case 'tool-displayPieChart':                        │ │
│ │       // Extract chartType from tool name               │ │
│ │       const chartType = extractChartType(part.type);    │ │
│ │       if (part.state === 'input-available' ||           │ │
│ │           part.state === 'output-available') {          │ │
│ │         return <ChartRenderer                           │ │
│ │           data={{ ...part.input, chartType }} />;       │ │
│ │       }                                                 │ │
│ │       return <ChartLoadingState />;                     │ │
│ │   }                                                     │ │
│ │ })                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ <ChartRenderer data={chartData} />                      │ │
│ │   ├── chartType === 'bar'  → <BarChartRenderer />       │ │
│ │   ├── chartType === 'line' → <LineChartRenderer />      │ │
│ │   └── chartType === 'pie'  → <PieChartRenderer />       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Part States:**
- `input-streaming`: Tool call being received (show loading)
- `input-available`: Tool input ready, can render chart
- `output-available`: Tool completed successfully
- `output-error`: Tool failed (show error message)

## Data Flow

```
1. User asks: "Show me a chart of food prices"
                │
                ▼
2. Agent queries data with existing tools
                │
                ▼
3. Agent decides data is chart-worthy and picks chart type
                │
                ▼
4. Agent calls displayBarChart/displayLineChart/displayPieChart:
   {
     title: 'מחירי מזון',
     data: [...],
     config: { indexBy: 'product', keys: ['price'] }
   }
                │
                ▼
5. Server executes tool (returns { rendered: true, ... })
                │
                ▼
6. Server streams tool result to client
                │
                ▼
7. MessageItem receives tool part with state 'output-available'
                │
                ▼
8. ChartRenderer renders Nivo chart with part.input
                │
                ▼
9. Agent continues/concludes response
```

## Zod Schemas

```typescript
// Bar chart schema
const displayBarChartInputSchema = z.object({
    title: z.string().optional(),
    data: z.array(z.record(z.string(), z.unknown())),
    config: z.object({
        indexBy: z.string(),
        keys: z.array(z.string()),
        layout: z.enum(['horizontal', 'vertical']).default('vertical'),
        groupMode: z.enum(['grouped', 'stacked']).default('grouped'),
    }),
});

// Line chart schema
const displayLineChartInputSchema = z.object({
    title: z.string().optional(),
    data: z.array(z.object({
        id: z.string(),
        data: z.array(z.object({
            x: z.union([z.string(), z.number()]),
            y: z.number(),
        })),
    })),
    config: z.object({
        enableArea: z.boolean().default(false),
        curve: z.enum(['linear', 'monotoneX', 'step', 'catmullRom']).default('monotoneX'),
    }),
});

// Pie chart schema
const displayPieChartInputSchema = z.object({
    title: z.string().optional(),
    data: z.array(z.object({
        id: z.string(),
        label: z.string(),
        value: z.number(),
    })),
    config: z.object({
        innerRadius: z.number().min(0).max(0.9).default(0),
    }),
});

// Union type for ChartRenderer
type DisplayChartInput =
    | ({ chartType: 'bar' } & DisplayBarChartInput)
    | ({ chartType: 'line' } & DisplayLineChartInput)
    | ({ chartType: 'pie' } & DisplayPieChartInput);
```

## Risks / Trade-offs

### Risk 1: Bundle size increase

**Impact**: ~150KB additional JavaScript
**Mitigation**:
- Use specific packages (`@nivo/bar`) not full bundle
- Dynamic imports if needed (future optimization)
- SSR for initial render

### Risk 2: Chart data format complexity

**Impact**: Agent might generate invalid chart data
**Mitigation**:
- Zod validation catches malformed data
- Clear agent instructions with examples
- Fallback to error display on validation errors

### Risk 3: Hebrew RTL compatibility

**Impact**: Labels might render incorrectly
**Mitigation**:
- Nivo supports RTL via CSS `direction: rtl`
- Test with Hebrew labels explicitly
- Container has `dir="rtl"` attribute

## Migration Plan

This is an additive feature with no breaking changes:

1. Install Nivo packages
2. Add tool definitions with execute functions
3. Add ChartRenderer component
4. Update MessageItem to handle chart tool parts
5. Update agent instructions

**Rollback**: Remove tools from agent tools object; charts simply won't be offered.

## Open Questions (Resolved)

1. **Chart sizing**: Fixed height (400px) ✓
2. **Color schemes**: Use Nivo defaults ✓
3. **Legend position**: Let Nivo decide ✓
4. **Single vs multiple tools**: Three separate tools ✓
