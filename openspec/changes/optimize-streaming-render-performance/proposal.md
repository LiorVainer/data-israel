# Optimize Streaming Render Performance

## Problem

React Profiler data from a single streaming response reveals **3.2 seconds of main thread blocked** across **165 commits** (React renders), with an average render duration of 19.5ms and peaks at 47.3ms. This causes visible jank during chat streaming.

**Root causes identified via profiling:**

| Component | Total Self Time | Re-renders | Avg/render | Issue |
|-----------|----------------|------------|------------|-------|
| DataSourcePickerContent | 376ms | 68 | 5.5ms | No memo, unstable context value, inline JSX props |
| ChatThread | 251ms | 68 | 3.7ms | `console.log` in render, no stream throttle, prop cascade |
| InputSection | 135ms | 158 | 0.9ms | No memo, status prop cascade to all children |
| NotificationPrompt | 71ms | 158 | 0.4ms | No memo, `console.log` in render, unstable callbacks |
| SidebarTrigger | 48ms | 160 | 0.3ms | No memo, re-renders from parent cascade |
| HomeLogoButton | 32ms | 160 | 0.2ms | No memo, re-renders from parent cascade |
| AmbientGlow | 32ms | 160 | 0.2ms | No memo, inline style objects |
| MessageItem | 24ms | 68 | 0.3ms | No memo, all items re-render during stream |
| Suggestions | N/A | N/A | N/A | No memo |

## Solution

A set of targeted React performance optimizations following Vercel's React best practices:

1. **Stream throttling** — Add `experimental_throttle: 50` to `useChat` to batch streaming chunk renders (~3x fewer commits)
2. **Component memoization** — Wrap key components with `React.memo()` to skip re-renders when props haven't changed
3. **Prop stabilization** — Ensure props passed during streaming are referentially stable (callbacks via `useCallback`, derived values via `useMemo`, boolean props scoped correctly)
4. **Context value memoization** — Memoize context values created in render to prevent cascading re-renders
5. **CSS content-visibility** — Apply `content-visibility: auto` to off-screen message items via CSS module
6. **Debug code removal** — Remove `console.log` calls in hot render paths

## Expected Impact

- Total commits: 165 → ~50-60 (throttle)
- Total render time: 3.2s → <1s (memo + throttle)
- Per-commit render: 19.5ms avg → <8ms avg (memo skips unchanged components)
- DataSourcePickerContent: 376ms → ~0ms when closed (memo)
- Navigation components (Sidebar/HomeLogoButton/AmbientGlow): 112ms → ~0ms (memo)

## Scope

- **In scope**: React component render performance during chat streaming
- **Out of scope**: Server-side streaming, API response time, network latency, bundle size

## Future Opportunities (Not in this change)

- **Landing page Server Components**: 8 presentational landing components (`AboutSection`, `Footer`, `SourcesSection`, etc.) are currently client components because the parent `page.tsx` uses hooks. Restructuring to a Server Component parent with client islands would save ~8-16KB of client JS. Separate proposal recommended.
- **React Compiler**: Would auto-memoize all components, eliminating the need for manual `React.memo()`. Requires build toolchain changes.
- **AIDevtools**: Shows 86 renders in profiling but is already dev-only and tree-shaken in production. No action needed.

## Affected Files

- `src/components/chat/ChatThread.tsx`
- `src/components/chat/MessageItem.tsx` + new `MessageItem.module.css`
- `src/components/chat/InputSection.tsx`
- `src/components/chat/DataSourcePicker.tsx`
- `src/components/chat/NotificationPrompt.tsx`
- `src/components/chat/Suggestions.tsx`
- `src/components/navigation/AppSidebar.tsx` (HomeLogoButton)
- `src/components/ui/AmbientGlow.tsx`
- `src/components/ui/sidebar.tsx` (SidebarTrigger)
