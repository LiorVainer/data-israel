# Design: Streaming Render Performance

## Architecture Decision

All optimizations are **local component-level changes** — no new abstractions, no architectural shifts. Each fix applies a standard React performance pattern (`memo`, `useCallback`, `useMemo`, CSS `content-visibility`) to an existing component.

## Optimization Strategy

### Layer 1: Reduce commit frequency (ChatThread)

**`experimental_throttle: 50`** on `useChat` batches streaming chunk updates into 50ms windows. This is the single highest-impact change — it reduces React commit count from ~165 to ~55, immediately cutting all downstream re-renders by ~3x.

Per AI SDK docs (v6.0.49), `experimental_throttle` is still the recommended approach. No stable replacement exists.

### Layer 2: Memoize components to skip unchanged subtrees

Wrap components in `React.memo()` so React can bail out of re-rendering when props haven't changed. Priority order based on profiling data:

1. **DataSourcePickerContent** (376ms) — Heaviest component. Also needs context value memoization in parent `DataSourcePicker`.
2. **InputSection** (135ms) — Receives `status` prop that changes during streaming but most children don't need it.
3. **NotificationPrompt** (71ms) — Pure presentational, rarely changes state.
4. **MessageItem** (24ms) — List item in `.map()`. With memo, only the last (streaming) item re-renders.
5. **Suggestions** — Small but easy win.
6. **Navigation** (SidebarTrigger, HomeLogoButton, AmbientGlow) — Re-render due to parent cascade, not prop changes.

### Layer 3: Stabilize props

Key unstable props identified:

| Component | Unstable Prop | Fix |
|-----------|--------------|-----|
| MessageItem | `isStreaming` (always `true` during stream) | Pass `isStreaming && isLastMessage` so non-last items get stable `false` |
| DataSourcePicker | context value object (recreated every render) | `useMemo` on context value |
| NotificationPrompt | `subscribe`/`unsubscribe` callbacks | Verify parent wraps in `useCallback` (already done in ChatThread) |

### Layer 4: CSS content-visibility

Apply `content-visibility: auto` to MessageItem wrapper via a CSS module (`MessageItem.module.css`) with `@apply` for Tailwind classes. This tells the browser to skip layout/paint for off-screen messages, reducing work for long conversations.

### Layer 5: Remove debug code

Remove `console.log` calls from:
- `ChatThread.tsx:250` — logs entire messages array every render
- `NotificationPrompt.tsx:51` — logs component state every render

## Trade-offs

| Decision | Pro | Con |
|----------|-----|-----|
| `experimental_throttle` | Biggest single improvement | "experimental" prefix — may change in future AI SDK versions |
| `React.memo` on many components | Prevents cascade re-renders | Slight memory overhead for prop comparison; must keep props stable |
| CSS `content-visibility` | Browser-native optimization, zero JS cost | Can cause scroll position quirks if `contain-intrinsic-size` estimate is wrong |
| CSS module for MessageItem | Keeps `content-visibility` scoped; uses `@apply` for Tailwind consistency | First CSS module in the project — sets precedent |

## What We're NOT Doing

- **React Compiler**: Would auto-memoize, but requires build toolchain changes and is out of scope
- **Virtualized list**: Message count is typically low (<50); virtualization adds complexity for minimal gain
- **Context splitting**: The re-render cascade from ChatThread to sidebar appears to be via React tree, not shared context. Memo on leaf components is sufficient.
