# Design: Chronological Message Parts Rendering

## Architecture

### Segmentation Algorithm

The core change introduces a `segmentMessageParts()` function that performs a single linear pass over `message.parts` and produces an array of render segments:

```typescript
type RenderSegment =
  | { kind: 'tool-group'; toolParts: Array<{ part: ToolCallPart; index: number }> }
  | { kind: 'part'; part: UIMessagePart; index: number };
```

**Algorithm:**
1. Iterate through `message.parts` in order
2. For each part:
   - If it's a **server-side tool** (starts with `tool-` AND not in `CLIENT_TOOL_TYPES`):
     - If previous segment is a `tool-group`, append to it
     - Otherwise, start a new `tool-group` segment
   - If it's **anything else** (text, reasoning, chart tool, source-url, step-start, etc.):
     - Emit as a `{ kind: 'part' }` segment
3. Return the segment array

**Key property**: Server-side tools separated by ANY non-tool part become separate groups. Same tool names in different groups stay separate.

### Rendering Flow (Before vs After)

**Before (MessageItem.tsx):**
```
1. Collect ALL toolParts (filter entire array)
2. Render <ToolCallParts> with ALL toolParts   ← always first
3. Render message.parts.map() for text/reasoning/charts
```

**After (MessageItem.tsx):**
```
1. Source URL collection (unchanged)
2. Call segmentMessageParts(message.parts) → RenderSegment[]
3. Render segments.map():
   - tool-group → <ToolCallParts toolParts={segment.toolParts} ... />
   - part → switch(part.type) for text/reasoning/charts/etc.
```

### Processing State Per Group

Currently `isToolsStillRunning` is a single boolean for the whole message. With multiple tool groups, only the **last** tool group in the message should show the processing indicator:

```typescript
// For each tool-group segment, determine if it's "processing"
const isLastToolGroup = segmentIndex === lastToolGroupIndex;
const isProcessing = isLastToolGroup && isToolsStillRunning && hasActiveToolsInGroup;
```

### ToolCallParts Component

The `ToolCallParts` component needs **no interface changes**. It already:
- Accepts `toolParts: Array<{ part: ToolCallPart; index: number }>`
- Groups by tool name internally via `groupToolCalls()`
- Computes its own stats via `calculateStats()`

Each instance will simply receive fewer tool parts (only those in its consecutive group), so the grouping and stats will naturally scope to that group.

### Source URL Collection

The source URL collection logic stays at the top of `MessageItem` and continues to scan ALL parts. This is correct because sources are rendered as a single `<SourcesPart>` at the bottom of the message, not interleaved.

### Console.log Cleanup

The current code has debug `console.log()` calls at lines 98-100 that should be removed as part of this change.

## Trade-offs

### Considered: Extract segmentation into a separate file
**Decision**: Keep `segmentMessageParts()` in `MessageItem.tsx` as a module-level function. It's a small pure function (~20 lines) used only by this component. Extract to a utility file only if reuse emerges.

### Considered: Memoize segments with useMemo
**Decision**: Yes, wrap `segmentMessageParts()` in `useMemo` with `[message.parts]` dependency to avoid re-segmenting on every render (e.g., when `isStreaming` or `isLastMessage` changes).

### Considered: New `key` strategy for ToolCallParts
**Decision**: Use `${messageId}-tools-${segmentIndex}` as the key for each `ToolCallParts` instance to ensure stable React keys when multiple tool groups exist.
