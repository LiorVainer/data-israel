# Change: Reorder Message Parts to Chronological Rendering

## Why

The current `MessageItem` component extracts **all** tool call parts from `message.parts` and renders them in a single `ToolCallParts` block at the top of the message, before any text or reasoning parts. This breaks the chronological ordering that AI SDK guarantees in its `parts` array.

For example, a message with parts `[reasoning, tools, text, tools, reasoning, text, chart, tool]` currently renders all 5 tools in one block at the top, then all text/reasoning below — losing the natural flow of the agent's work.

The AI SDK migration guide 4.2 explicitly states: "The new message parts approach replaces separate properties with an ordered array that preserves the exact sequence." Our rendering should honor this.

## What Changes

- Refactor `MessageItem.tsx` to render parts in their natural chronological order
- Add a `segmentMessageParts()` utility that groups consecutive server-side tool parts into segments while keeping everything else in order
- Multiple `ToolCallParts` instances can appear in a single message (one per consecutive tool group)
- Same tool name in different groups is NOT merged across groups
- Processing indicator scoped to the last tool group only
- Client tools (charts) remain inline at their position
- Source URL collection remains unchanged (scans all parts, renders at bottom)
- Remove debug `console.log()` calls

## Scope

| File | Change |
|------|--------|
| `components/chat/MessageItem.tsx` | Replace two-phase render with segmentation + linear `.map()` |

No changes to `ToolCallParts.tsx`, `ToolCallStep.tsx`, types, or any other files.
