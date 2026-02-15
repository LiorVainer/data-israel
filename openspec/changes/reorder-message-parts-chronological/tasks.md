# Tasks: reorder-message-parts-chronological

## 1.0 Implement segmentation utility
- [x] 1.1 Add `RenderSegment` type definition in `MessageItem.tsx` (discriminated union: `tool-group` | `part`)
- [x] 1.2 Implement `segmentMessageParts()` pure function that takes `message.parts` and `CLIENT_TOOL_TYPES` set, returns `RenderSegment[]`
- [x] 1.3 Verify: consecutive server-side tools are grouped, client tools (charts) are individual `part` segments, non-tool parts are individual segments

## 2.0 Refactor MessageItem rendering
- [x] 2.1 Remove the top-level `toolParts` extraction and the single `<ToolCallParts>` block
- [x] 2.2 Remove `agentsNetworkDataParts`, `hasActiveTools`, `isLastPartServerTool`, `isToolsStillRunning` as previously computed
- [x] 2.3 Add `useMemo` call for `segmentMessageParts(message.parts)`
- [x] 2.4 Compute `lastToolGroupIndex` from segments for scoping processing state
- [x] 2.5 Replace `message.parts.map()` with `segments.map()` that renders tool-group and part segments chronologically
- [x] 2.6 Remove debug `console.log()` calls

## 3.0 Verify & validate
- [x] 3.1 Run `tsc` — no new TypeScript errors
- [x] 3.2 Run `npm run build` — build succeeds
- [ ] 3.3 Run `npm run lint` — no new lint errors
- [ ] 3.4 Manual test: send a query that triggers multiple tool calls with text between them, verify chronological rendering
- [ ] 3.5 Manual test: verify chart tools still render inline at correct position
- [ ] 3.6 Manual test: verify source URLs still collect from all parts and display at bottom
